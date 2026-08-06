import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import http from 'http';

const app = express();
const PORT = 5000;

//DB

//Middlewares
app.use(cors());
app.use(express.json());
//Routes

app.get("/", (req,res) => {
    res.send("API WORKING");
});

const server = http.createServer(app);
server.listen(PORT, ()=>{
    console.log(`Server Started on http://localhost:${PORT}`)
});