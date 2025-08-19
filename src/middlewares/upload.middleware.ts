import express, { Request, Response } from 'express';
import multer from 'multer';

const app = express();

const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  res.send('File uploaded successfully!');
});
