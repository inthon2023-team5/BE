// 1. Import document loaders for different file formats
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { JSONLoader } from 'langchain/document_loaders/fs/json';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { CSVLoader } from 'langchain/document_loaders/fs/csv';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';

// 2. Import OpenAI language model and other related modules
import { OpenAI } from 'langchain/llms/openai';
import { RetrievalQAChain } from 'langchain/chains';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

// 3. Import Tiktoken for token counting
import { Tiktoken } from '@dqbd/tiktoken/lite';
import { load } from '@dqbd/tiktoken/load';
import registry from '@dqbd/tiktoken/registry.json' assert { type: 'json' };
import models from '@dqbd/tiktoken/model_to_encoding.json' assert { type: 'json' };

// 4. Import dotenv for loading environment variables and fs for file system operations
import dotenv from 'dotenv';
import fs from 'fs';
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

// 7. Define a function to calculate the cost of tokenizing the documents
async function calculateCost() {
  const modelName = 'text-embedding-ada-002';
  const modelKey = models[modelName];
  const model = await load(registry[modelKey]);
  const encoder = new Tiktoken(
    model.bpe_ranks,
    model.special_tokens,
    model.pat_str,
  );
  const tokens = encoder.encode(JSON.stringify(docs));
  const tokenCount = tokens.length;
  const ratePerThousandTokens = 0.0004;
  const cost = (tokenCount / 1000) * ratePerThousandTokens;
  encoder.free();
  return cost;
}

// const VECTOR_STORE_PATH = 'Documents.index';
const VECTOR_STORE_PATH = dirPath2;
// const question = '이 문서에 대해 알려줘';

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

// 9. Define the main function to run the entire process
const run = async (question, OPENAI_API_KEY) => {
  // 10. Calculate the cost of tokenizing the documents
  console.log('Calculating cost...');
  const cost = await calculateCost();
  console.log('Cost calculated:', cost);

  // 11. Check if the cost is within the acceptable limit
  if (cost <= 1) {
    try {
      // 12. Initialize the OpenAI language model
      const model = new OpenAI({
        modelName: 'gpt-3.5-turbo', //gpt-3.5-turbo-instruct로 교체 가능
        temperature: 0.2,
        openAIApiKey: OPENAI_API_KEY,
      });
      // console.log(process.env.OPENAI_API_KEY);
      let vectorStore;

      // 13. Check if an existing vector store is available
      console.log('Checking for existing vector store...');
      if (fs.existsSync(VECTOR_STORE_PATH)) {
        // 14. Load the existing vector store
        console.log('Loading existing vector store...');
        vectorStore = await HNSWLib.load(
          VECTOR_STORE_PATH,
          new OpenAIEmbeddings({
            openAIApiKey: OPENAI_API_KEY,
          }),
        );
        console.log('Vector store loaded.');
      } else {
        // 15. Create a new vector store if one does not exist
        console.log('Creating new vector store...');
        const textSplitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
        });
        const normalizedDocs = normalizeDocuments(docs);
        const splitDocs = await textSplitter.createDocuments(normalizedDocs);

        // 16. Generate the vector store from the documents
        vectorStore = await HNSWLib.fromDocuments(
          splitDocs,
          new OpenAIEmbeddings({
            openAIApiKey: OPENAI_API_KEY,
          }),
        );
        // 17. Save the vector store to the specified path
        await vectorStore.save(VECTOR_STORE_PATH);

        console.log('Vector store created.');
      }

      // 18. Create a retrieval chain using the language model and vector store
      console.log('Creating retrieval chain...');
      const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

      // 19. Query the retrieval chain with the specified question
      console.log('Querying chain...');
      const res = await chain.call({ query: question });
      console.log({ res });
      return res;
    } catch (error) {
      console.log(error);
      return '아직 질문을 받은 적 없는 내용입니다.';
    }
  } else {
    // 20. If the cost exceeds the limit, skip the embedding process
    console.log('The cost of embedding exceeds $1. Skipping embeddings.');
  }
};

export { run };
// 21. Run the main function
// run('컴퓨터학과에서 실리콘밸리에 가는 법이 있나요?');
