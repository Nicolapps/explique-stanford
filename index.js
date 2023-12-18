var cookieParser = require('cookie-parser')
    , bodyParser = require('body-parser')
    , express = require('express')
    , expressSession = require('express-session')
    , http = require('http')
    , https = require('https')
    , methodOverride = require('method-override')
    , morgan = require('morgan')
    , package = require('./package.json')
    , passport = require('passport')
    , ca = require('./ca')
    , TequilaStrategy = require('passport-tequila').Strategy;

// Wiring up Passport session management.
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session. Typically,
// this will be as simple as storing the user ID when serializing, and finding
// the user by ID when deserializing. However, since this example does not
// have a database of user records, the complete Tequila session state is
// serialized and deserialized.
passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

// Use the TequilaStrategy within Passport.
var tequila = new TequilaStrategy({
    service: "Demo Tequila App in node.js",
    request: ["displayname"],
    // require: "group=openstack-sti",  // Uncomment and use a group you are a member of.
});
passport.use(tequila);

var app = express();
// configure Express
app.use(morgan("dev"));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(methodOverride());
app.use(expressSession({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));
// Initialize Passport! Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());
app.get('/', function(req, res) {
    res.send('index');
});

app.get('/status', function(req, res) {
    res.send(`${package.name}@${package.version} OK`);
});

// This is how you Tequila-protect a page:
app.get('/private', tequila.ensureAuthenticated, function(req, res) {
    res.send(`private ${req.user}}`);
});

// To log out, just drop the session cookie.
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

// Alternatively, we can also log out from Tequila altogether.
app.get('/globallogout', tequila.globalLogout("/"));

// An https app is better suited to use Tequila.
var httpsPort = process.env.PORT ? Number(process.env.PORT) : 4300;

// Get a SSL certificate...
ca().then(({ ca, cached }) => {
  // And create the server.
  var httpsServer = https.createServer(ca, app);
  // Then output guidelines.
  httpsServer.listen(httpsPort, () => {
    var url = `\x1b[32mhttps://localhost:${httpsServer.address().port}\x1b[0m`;
    console.log(`Demo server listening on: ${url}`);
    if (!cached) {
      console.log('Your browser may warn you the connection is not private.');
      console.log('It\'s because the SSL certificate is self-signed.');
      console.log('Just proceed to the website anyway.');
    }
  });
});
