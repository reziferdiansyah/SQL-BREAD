var express = require('express');
var app = express();
const path = require('path');
var sqlite3 = require('sqlite3').verbose();
var bodyParser = require('body-parser')
var urlencodeParser = bodyParser.urlencoded({
  extended: false
});
const port = 3000

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(express.static(path.join(__dirname, 'public')));

//menghubungkan ke data base
let db = new sqlite3.Database(path.join(__dirname, 'data.db'));
//console.log(db);

//membuat tabel
db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT,string TEXT, integer INTEGER, float INTEGER, date TEXT, boolean TEXT)');

app.get('/', function (req, res, next) {
  const page = req.query.page || 1;
  const limit = 5;
  const offset = (page - 1) * limit;
  const url = req.url == '/' ? '/?page=1' : req.url

  let params = [];
  let isFilter = false;
  
  if (req.query.checkid && req.query.formid) {
    params.push(`id=${req.query.formid}`);
    isFilter = true;
  }
  if (req.query.checkstring && req.query.formstring) {
    params.push(`string like '%${req.query.formstring}%'`);
    isFilter = true;
  }
  if (req.query.checkinteger && req.query.forminteger) {
    params.push(`integer=${req.query.forminteger}`);
    isFilter = true;
  }
  if (req.query.checkfloat && req.query.formfloat) {
    params.push(`float=${req.query.formfloat}`);
    isFilter = true;
  }
  if (req.query.checkdate && req.query.formdate && req.query.formenddate) {
    params.push(`date between '${req.query.formdate}' and '${req.query.formenddate}'`);
    isFilter = true;
  }
  if (req.query.checkboolean && req.query.boolean) {
    params.push(`boolean='${req.query.boolean}'`);
    isFilter = true;
  }

  let sql = `select count(*) as total from users`;
  if (isFilter) {
    sql += ` where ${params.join(' and ')}`
  }
  console.log(params.join(' and '))
  db.all(sql, (err, count) => {
    const total = count.total;
    const pages = Math.ceil(total / limit);
    sql = `select * from users`;
    if (isFilter) {
      sql += ` where ${params.join(' and ')}`
    }
    sql += ` limit ${limit} offset ${offset}`;
    db.all(sql, (err, rows) => {
      res.render('index.ejs', {
        rows,
        page,
        pages,
        query: req.query,
        url
      });
    });
  });

});

app.get('/add', function (req, res, next) {
  res.render('add');
});

app.post('/add', urlencodeParser, function (req, res) {
  let sql = 'INSERT INTO users (id, string,integer, float, date, boolean) VALUES (?,?,?,?,?,?)'
  db.run(sql, req.body.id, req.body.string, req.body.integer, req.body.float, req.body.date, req.body.boolean, (err) => {
    if (err) {
      console.error(err.messsage);
    }
    console.log('post to add success');
    //console.log(db);
  })
  res.redirect('/');
})

app.post('/edit/:id', function (req, res) {
  let id = req.params.id;
  let sql = ' update users set string = ?, integer= ?, float = ?, date = ?, boolean = ? where id = ? '
  db.run(sql,
    req.body.string, req.body.integer, req.body.float, req.body.date, req.body.boolean, id, (err) => {
      if (err) {
        console.error(err.messsage);
      }
      console.log('post to edit success');
    });
  res.redirect('/');
})

app.get('/edit/:id', function (req, res, next) {
  let id = req.params.id;
  db.all('select * from users where id = $id', {
    $id: id
  }, (err, rows) => {
    res.render('edit', {
      item: rows[0],
      id: id
    })
    //console.log(rows[0]);
  })
});

app.get('/delete/:id', function (req, res, next) {
  let id = req.params.id;
  db.run('delete from users where id= $id', {
    $id: id
  },
    req.body.id, (err) => {
      if (err) {
        console.error(err.messsage);
      }
      console.log('delete success');
    })
  res.redirect('/');
});

app.listen(port, () => {console.log(`web berjalan di port ${port}`)})