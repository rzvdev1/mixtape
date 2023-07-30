'use strict';

const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_ID,
  clientSecret: process.env.SPOTIFY_SECRET,
  redirectUri: process.env.REDIRECT_URI,
});

spotifyApi.clientCredentialsGrant().then(
  (data) => {
    console.log('The access token expires in ' + data.body['expires_in']);
    console.log('The access token is ' + data.body['access_token']);

    // Save the access token so that it's used in future calls
    spotifyApi.setAccessToken(data.body['access_token']);
  },
  function (err) {
    console.log('Something went wrong when retrieving an access token', err);
  }
);

function getUser(req, res, next) {
  spotifyApi
    .getUser(req.user)
    .then((data) => {
      res.body = data;
      res.status(200).json(res.body);
    })
    .catch((err) => {
      console.log('Something went wrong!', err);
    });
}

// // Get a user's playlists
// spotifyApi.getUserPlaylists('thelinmichael')
//   .then(function(data) {
//     console.log('Retrieved playlists', data.body);
//   },function(err) {
//     console.log('Something went wrong!', err);
//   });

module.exports = { getUser, spotifyApi };
