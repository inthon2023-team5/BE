// 1. Import document loaders for different file formats
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { JSONLoader } from 'langchain/document_loaders/fs/json';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { CSVLoader } from 'langchain/document_loaders/fs/csv';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';

// 2. Import OpenAI language model and other related modules

import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

// 4. Import dotenv for loading environment variables and fs for file system operations
import dotenv from 'dotenv';

// import path from 'path';
// const dirPath = path.resolve(__dirname, './documents');

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../'); // Adjust this path as necessary
const dirPath = path.resolve(projectRoot, './src/ai/documents');
const dirPath2 = path.resolve(projectRoot, './src/ai/Documents.index');

dotenv.config();

console.log(process.env.OPENAI_API_KEY);
// 5. Initialize the document loader with supported file formats
const loader = await new DirectoryLoader(dirPath, {
  '.json': (path) => new JSONLoader(path),
  '.txt': (path) => new TextLoader(path),
  '.csv': (path) => new CSVLoader(path),
  '.pdf': (path) => new PDFLoader(path),
});

// 6. Load documents from the specified directory
console.log('Loading docs...');
const docs = await loader.load();
console.log('Docs loaded.');

const VECTOR_STORE_PATH = dirPath2;

// 8. Define a function to normalize the content of the documents
function normalizeDocuments(docs) {
  return docs.map((doc) => {
    if (typeof doc.pageContent === 'string') {
      return doc.pageContent;
    } else if (Array.isArray(doc.pageContent)) {
      return doc.pageContent.join('\n');
    }
  });
}

const updateVector = async () => {
  // 15. Create a new vector store if one does not exist
  console.log('Creating new vector store...');
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
  });
  const normalizedDocs = normalizeDocuments(docs);
  const splitDocs = await textSplitter.createDocuments(normalizedDocs);
  let vectorStore;
  // 16. Generate the vector store from the documents
  vectorStore = await HNSWLib.fromDocuments(
    splitDocs,
    new OpenAIEmbeddings({
      openAIApiKey: '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',
    }),
  );
  // 17. Save the vector store to the specified path
  await vectorStore.save(VECTOR_STORE_PATH);

  console.log('Vector store created.');
};
await updateVector();
// 21. Run the main function
