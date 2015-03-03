var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({secret: 'jamaicanbacon', resave: true, saveUninitialized: false}));
app.use(express.static(__dirname + '/public'));

var restrict = function(req, res, next){
  // If user exists
  if(req.session.user){
    // Execute the next piece of middleware/endware
    next();
  } else { // If user does not exist

    req.session.error = "Not allowed!";
    res.redirect('/login');
  }
};

app.get('/', restrict,
function(req, res) {
  //if user is signed in
    res.render('index');
  //else
  //  render the login page
});

app.get('/login', function(req, res) {
  res.render('login');
});

app.post('/login', function(req, res) {

  var username = req.body.username;
  var password = req.body.password;

  if (username === 'hi' && password === 'hello') {
    req.session.regenerate(function() {
        req.session.user = username;
        console.log('we\'re in the branch where user\'s been approved');
        res.redirect('/restricted');
    });
  }else {
    res.redirect('login');
  }
});

app.post('/signup', function(req, res) {
  var user = new User({
          'username': req.body.username,
          'password': req.body.password
      }).save().then(function(){
        console.log(user)
        done();
      });
  console.log('in the signup branch')

});

app.get('/restricted', restrict,
  function(req, res) {
    res.render('index');
  // response.send('This is the restricted area! Hello ' + request.session.user
  //   + '! click <a href="/logout">here to logout</a>');
});

app.get('/create', restrict,
function(req, res) {
  res.render('index');
});

app.get('/links', restrict,
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links',
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
