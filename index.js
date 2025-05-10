//dumpstr server things

const boards = ["dump","test","news","tech","weeb","game"];

import express from "express";
import cors from "cors";

const app = express();

//fix this idk
const opts = {
  origin: [process.env.ORG || "http://localhost:5173/"], 
  methods: ["POST", "GET"],
  credentials: true};

app.use(cors());
app.use(express.json());


const PORT = process.env.PORT || 5545;


// This; dbname is specified and used here
import db from "./connection.js";
const data = db.collection("board-data");//ok

//import { ObjectId } from "mongodb";//unused?



// start the Express server
app.listen(PORT, () => {
  console.log(`new  server running? you'd better catch it!! ${PORT}`);
});


//for now- get all posts from specified board
app.get("/", async (req,res) => {
//board name would be req.params.board i guess
  let collection = await db.collection("board-data");//also this
  let results = await collection.find({_id: "dump"}).toArray();
  res.send(results).status(200);

 //res.send("your momma");
});



//get threads for a specified board
app.get("/getthreads", async (req, res) => {
  const board = req.query.id;
//console.log(board);

  let collection = await db.collection(board);
//if board/collection not found, blocked, whateber, return an error page. else,


const grope = {$group: {_id: "$tid"} };//yatta... doh
  let results = await collection.aggregate([grope]).toArray();
//console.log("ids ", results);
//next: sort these by latest post... after getting posts I guess
//


//results is thread ids, like so-
//[ { _id: 12345 }, { _id: 52345 } ]
//next, for id in results, get posts for that thread id and package them together.
const posts = {};

for (const td of results) {
const array = [];
//get posts with threadid,   sorted by id/timestamp <-- do this
// { $sort: { _id: 1 } }
  let rs = collection.find({ tid: td._id });//.toArray();
//for await
for await (const p of rs) {
//console.log(p);
//append to array, then append array to posts
//? make posts dict and like {tid12: [], tid56: []}
array.push(p);
}//for
posts[td._id] = array;
}//for

//console.log(posts);

//return results (:
res.send(posts).status(200);

});




//get replies to a thread
app.get("/getposts", async (req, res) => {
  const tid = parseInt(req.query.tid);//shrug
  const board = req.query.id;
console.log(board,'  ',tid);
  let collection = await db.collection(board);
//lmao errorchecking, lol

const array = [];

// { $sort: { _id: 1 } }
  let rs = collection.find({ tid: tid });//.toArray();
//console.log("array ",rs.toArray());

//for await
//...this is basically just properly awaiting for all posts to be got... 
// ..... which now doesn't work........

for await (const p of rs) {
console.log("posts pls");
console.log(p);//...
 array.push(p);
}//for

//console.log(rs.toArray());
console.log(array);

res.send(array).status(200);

});




//post a new thread
app.post("/create", async (req, res) => {
 console.log( req.body );



});//create





//post a post
app.post("/post", async (req, res) => {

const col = db.collection(req.body.board);//ok

//actually, imgurl is optional for non-threadstarting posts,
//and id/_id is determined on posting
//? track last/highest post id so far or get posts sorted by id and determine... probably the former
//so, on sucessful posting update highest post number, wherever that's stored

//password.
//ideal form (aside from actual auth): hash of pw stored in env. hash the sent-in pw to check it. for now just

//if pw != pw, return w/ status error
//should it be a try-throw-catch thing? for now if-else is fine

if (req.body.pw != process.env.PWRD) {

res.send("no").status(401);
//incorrect password correctly rejected. next: properly return and handle result, inc reloading the page on successful posting.

} else {

//timestamp pls
const timestamp = new Date().getTime();

//can't actually use max ID in collection, as even if most recent post is like instantly deleted the number shouldn't be reused.
//ideally the collection(s) should be locked before this and unlocked after...
//transactions?
const dat = await data.findOne( {_id: req.body.board }, {lastid: 1} );
const nextid = dat.lastid + 1;
//console.log(nextid);

const doc = {
_id: nextid,

tid: (parseInt(req.body.tid) == -1) ? nextid:parseInt(req.body.tid),//yay (:

name: req.body.name,
postbody: req.body.postbody,
imgurl: req.body.imgurl,
timestamp: timestamp
}
//if imgurl is blank, don't even add that key. mongodb is cool like that
//ditto thread title, for... thread starting posts only

//and go
try {
const r = await col.insertOne(doc);
//console.log(r);

//+ if successful, update board data lastid
 try{

  const r2 = await data.updateOne({ _id: req.body.board }, {$set: {lastid: nextid} });
//  console.log(r2);
//res.send(r).status(200);

 } catch (e2) {
  console.log(e2);
 };

} catch (e) {
console.log(e);
};

}//giant stupid else block

});//create