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
import fs from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../'); // Adjust this path as necessary
const dirPath = path.resolve(projectRoot, './src/ai/documents');
const dirPath2 = path.resolve(projectRoot, './src/ai/Documents.index');
const txtPath = path.resolve(projectRoot, './src/ai/documents/langchain.txt');

dotenv.config();

// 5. Initialize the document loader with supported file formats
const loader = await new DirectoryLoader(dirPath, {
  '.json': (path) => new JSONLoader(path),
  '.txt': (path) => new TextLoader(path),
  '.csv': (path) => new CSVLoader(path),
  '.pdf': (path) => new PDFLoader(path),
});

// 6. Load documents from the specified directory

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

const test_data = [
  { chatroomid: 1, chat: '이거 뭔가요', isQuestion: true },
  { chatroomid: 1, chat: '이건 또 뭔가요', isQuestion: false },
  { chatroomid: 1, chat: '이건 이겁니다', isQuestion: true },
  { chatroomid: 1, chat: '이건 이겁니다', isQuestion: false },
  { chatroomid: 1, chat: '이건 뭔가요', isQuestion: true },
  { chatroomid: 1, chat: '이건 이겁니다', isQuestion: false },
  { chatroomid: 2, chat: 'hihihi', isQuestion: true },
  { chatroomid: 2, chat: 'nonono', isQuestion: false },
  { chatroomid: 3, chat: 'hihihi', isQuestion: true },
  { chatroomid: 3, chat: 'hihihi', isQuestion: true },
  { chatroomid: 3, chat: 'nonono', isQuestion: false },
  { chatroomid: 4, chat: '대답을 못 받은 질문', isQuestion: true },
  { chatroomid: 4, chat: '답', isQuestion: false },
  { chatroomid: 4, chat: '대답을 못 받은 질문', isQuestion: true },
  { chatroomid: 5, chat: '대답을 못 받은 질문', isQuestion: true },
];
function formatChatData(chatData) {
  const groupedByRoom = chatData.reduce((acc, item) => {
    if (!acc[item.chatroomid]) {
      acc[item.chatroomid] = [];
    }
    acc[item.chatroomid].push(item);
    return acc;
  }, {});

  const result = [];

  Object.values(groupedByRoom).forEach((chatItems) => {
    let currentGroup = [];
    let groups = [];

    chatItems.forEach((item) => {
      const isQuestion = item.isQuestion;
      const prefix = isQuestion ? '질문: ' : '답변: ';

      // 답변 다음에 새로운 질문이 나오면 현재 그룹을 결과에 추가하고 새 그룹을 시작합니다.
      if (
        isQuestion &&
        currentGroup.length > 0 &&
        currentGroup[currentGroup.length - 1].startsWith('답변:')
      ) {
        groups.push(currentGroup);
        currentGroup = [];
      }

      currentGroup.push(prefix + item.chat);
    });

    // 마지막 그룹을 추가합니다.
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    // 질문만으로 이루어진 그룹을 제거합니다.
    groups = groups.filter((group) => group.some((c) => c.startsWith('답변:')));

    // 최종 결과에 추가합니다.
    groups.forEach((group) => result.push(group.join(', ')));
  });

  return result;
}

function joinChatsAsString(chats) {
  return chats.join('\n');
}

function writeToFile(filePath, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, 'utf8', (err) => {
      if (err) {
        console.error('파일 쓰기 중 오류 발생:', err);
        reject(err);
      } else {
        console.log(`${filePath}에 데이터가 성공적으로 저장되었습니다.`);
        resolve();
      }
    });
  });
}

// 예시 사용
// const filePath = ''; // 변경할 파일의 경로
// const formattedChats = formatChatData(test_data);
// const dataToWrite = joinChatsAsString(formattedChats);

// writeToFile(txtPath, dataToWrite);

const updateVector = async (OPENAI_API_KEY, chat_data) => {
  const formattedChatData = formatChatData(chat_data);
  const dataToWrite = joinChatsAsString(formattedChatData);
  // 파일 작성 작업이 완료될 때까지 기다립니다.
  await writeToFile(txtPath, dataToWrite);

  console.log('Loading docs...');
  const docs = await loader.load();
  console.log('Docs loaded.');
  // 15. Create a new vector store if one does not exist
  console.log('Creating new vector store...');
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
  });
  const normalizedDocs = await normalizeDocuments(docs);
  const splitDocs = await textSplitter.createDocuments(normalizedDocs);
  let vectorStore;
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
};

export { updateVector };

// 21. Run the main function
