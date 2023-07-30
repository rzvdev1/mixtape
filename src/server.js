'use strict';

// 3rd Party Resources
const express = require('express');
const cors = require('cors');

// Esoteric Resources
const errorHandler = require('./error-handlers/500.js');
const notFound = require('./error-handlers/404.js');
const authRoutes = require('./auth/routes.js');
// const logger = require('./middleware/logger.js');
const v1Routes = require('./routes/v1.js');
const v2Routes = require('./routes/v2.js');

// Prepare the express app
const app = express();

// App Level MW
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(logger);

// Routes
app.get('/', (req, res) => res.status(200).send('Hello, World!'));
app.use(authRoutes);

app.use('/api/v1', v1Routes);
//localhost:3000/api/v1/food/2
app.use('/api/v2', v2Routes);

// Catchalls
app.use('*', notFound);
app.use(errorHandler);

const bodyParser = require('body-parser');
const path = require('path');
const SpotifyWebApi = require('spotify-web-api-node');

app.use(express.static(path.resolve(__dirname, '../build')));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/login', (req, res) => {
  const scopes = [
    'streaming',
    'user-read-recently-played',
    'user-read-playback-state',
    'user-top-read',
    'user-modify-playback-state',
    'user-follow-read',
    'user-library-read',
    'user-library-modify',
    'user-read-email',
    'user-read-private',
  ];

  res.redirect(
    `https://accounts.spotify.com/authorize?client_id=${
      process.env.SPOTIFY_APP_CLIENT_ID
    }&response_type=code&redirect_uri=${
      process.env.REDIRECT_URI
    }&scope=${scopes.join('%20')}`
  );
});

app.post('/auth', (req, res) => {
  const code = req.body.code;

  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_APP_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_APP_CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI,
  });

  //object to store all returned data from the api calls below
  const userJSON = {};

  spotifyApi
    .authorizationCodeGrant(code)
    .then((data) => {
      userJSON['expiresIn'] = data.body['expires_in'];
      userJSON['accessToken'] = data.body['access_token'];
      userJSON['refreshToken'] = data.body['refresh_token'];

      //retrieve the current user's info
      spotifyApi.setAccessToken(data.body['access_token']);
      return spotifyApi.getMe();
    })
    .then((data) => {
      userJSON['userId'] = data.body['id'];
      userJSON['name'] = data.body['display_name'];
      userJSON['email'] = data.body['email'];

      const image = data.body.images[0].url;
      userJSON['image'] = image;
      userJSON['product'] = data.body['product'];

      res.status(201).send(userJSON);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.post('/refresh', (req, res) => {
  const refreshToken = req.body.refreshToken;

  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_APP_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_APP_CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI,
    refreshToken,
  });

  spotifyApi
    .refreshAccessToken()
    .then((data) => {
      console.log('The access token has been refreshed!');
      res.status(201).json({
        accessToken: data.body.access_token,
        expires_in: data.body.expires_in,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
});

app.post('/tracks', async (req, res) => {
  try {
    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_APP_CLIENT_ID,
    });
    spotifyApi.setAccessToken(req.body.token);

    const getTracks = await spotifyApi.searchTracks(req.body.searchTerm);
    res.status(201).send(getTracks);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post('/playlist', async (req, res) => {
  try {
    const { accessToken, userId } = req.body;
    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_APP_CLIENT_ID,
    });
    spotifyApi.setAccessToken(accessToken);

    const getPlaylists = await spotifyApi.getUserPlaylists(userId);
    res.status(201).send(getPlaylists);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post('/profile-artists', async (req, res) => {
  try {
    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_APP_CLIENT_ID,
    });
    spotifyApi.setAccessToken(req.body.accessToken);

    const getArtists = await spotifyApi.getFollowedArtists();
    res.status(201).send(getArtists);
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = {
  app,
  start: (port) => {
    app.listen(port, () => {
      console.log(`Server Up on ${port}`);
    });
  },
};
