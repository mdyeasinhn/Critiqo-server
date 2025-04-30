import express, { Application, Request, Response } from "express";
import cors from "cors";
import router from "./app/routes";
import cookieParser from 'cookie-parser';


const app: Application = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.get('/', (req: Request, res: Response) => {
    res.send({
        message: "Critiqo server"
    })
});

// Application routes
app.use('/api/v1', router);

app.get("/", (req: Request, res: Response) => {
    res.send({
      message: "The server is running",
    });
  });


  export default app;