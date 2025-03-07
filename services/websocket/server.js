"use strict";

/**
 * Filename: server.js
 * Author: Ethan Lindeman
 * 
 *      This file executes the Node server
 *      for the websocket microservice
 */

const http = require("http");


const port = process.env.PORT || 3005;


const server = http.createServer();

const io = require('socket.io')(server);




server.listen(port);

/***
    * handler for incoming socket connections
    * 
    * this listens for a socket connection and on the emit of "datasend" from a client, routes through to all other clients listening for tweets
    */

io.on('connection', (socket) => {
    console.log("connected client");
    socket.on('datasend', (data) => {
        console.log("sending data");
        io.emit('tweet', data);
    });
    
    socket.on("disconnect", (data) => {
        console.log("client disconnected");
    })
});

const db = require('./db/db');
db();