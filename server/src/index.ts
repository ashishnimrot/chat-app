import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import os from 'os';

dotenv.config();

const app: Application = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Backend server is running with TypeScript!');
});

// app.get('/api/v1/test', (req: Request, res: Response) => {
//   res.json({ message: 'Backend server is running with TypeScript!' });
// });


app.get('/api/v1/test', (req, res) => {
  const hostname = os.hostname();
  console.log(`Request handled by pod: ${hostname}`);
  res.json({ message: `Hello from pod ${hostname}` });
});


app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
