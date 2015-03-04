var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var bcrypt = require('bcrypt');


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

var checkUser = function(req, res, next){
  // If user exists
  if(req.session.user){
    // Execute the next piece of middleware/endware
    next();
  } else { // If user does not exist
    req.session.error = "Not allowed!";
    res.redirect('/login');
  }
};

app.get('/', checkUser,
function(req, res) {
  //if user is signed in
    res.render('index');
  //else
  //  render the login page
});

app.get('/logout', function(req, res){
  req.session.regenerate(function(){
    res.redirect('/');
  });
});

app.route('/login')

  .get(function(req, res) {
    res.render('login');
  })

<<<<<<< HEAD
  .post(function(req, res) {
=======
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
>>>>>>> c616ef6bd388b593af1766ab682e1fa1c78f3a90

    var username = req.body.username;
    var password = req.body.password;

<<<<<<< HEAD
    var user = new User({username: username});
=======
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
>>>>>>> c616ef6bd388b593af1766ab682e1fa1c78f3a90

    user.fetch().then(function(found) {
      if (found) {
        var salt = found.attributes.salt;
        var hash = bcrypt.hashSync(password, salt);
        if (hash === found.attributes.password) {
          req.session.regenerate(function(){
            req.session.user = username;
            res.redirect('/');
          });
        } else {
          // res.send(200, 'incorect password');
          res.redirect('/login');
        }
      } else {
        // res.send(200, 'user not found');
        res.redirect('/login');
      }
    });
  });

app.route('/signup')

  .get(function(req, res){
    res.render('signup');
  })

  .post(function(req, res){
    new User({username: req.body.username}).fetch().then(function(found) {
      if (found) {
        res.send(200, "username already taken");
      } else {
        var user = new User({
          username: req.body.username,
          password: req.body.password,
        });

        user.save().then(function(newUser) {
          req.session.regenerate(function(){
            req.session.user = newUser.attributes.username;
            res.redirect('/');
          });
        });
      }
    });
  });

app.get('/create', checkUser,
function(req, res) {
  res.render('index');
});

app.route('/links')
  .get(checkUser,
    function(req, res) {
      Links.reset().fetch().then(function(links) {
        res.status(200).send(links.models);
      });
  })

  .post(function(req, res) {
    var uri = req.body.url;

    if (!util.isValidUrl(uri)) {
      console.log('Not a valid url: ', uri);
      return res.status(404).send();
    }

    new Link({ url: uri }).fetch().then(function(found) {
      if (found) {
        res.send(200, found.attributes);
      } else {
        util.getUrlTitle(uri, function(err, title) {
          if (err) {
            console.log('Error reading URL heading: ', err);
            return res.status(404).send();
          }

          var link = new Link({
            url: uri,
            title: title,
            base_url: req.headers.origin
          });

          link.save().then(function(newLink) {
            Links.add(newLink);
            res.status(200).send(newLink);
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
