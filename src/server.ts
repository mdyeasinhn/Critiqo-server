import { Server } from "http";
import app from "./app";

const port = 5000;

async function main() {
  try {
    const server: Server = app.listen(port, () => {
      console.log(`App is listening at port ${port}`);
    });
  } catch (err) {
    console.log(err);
  }
}

main();
