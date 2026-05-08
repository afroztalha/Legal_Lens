from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv
import os
import glob

load_dotenv()

CHROMA_DIR = "chroma_db"
LAW_DOCS_DIR = "law_docs"

def build_vectorstore():
    pdfs = glob.glob(f"{LAW_DOCS_DIR}/*.pdf")
    docs = []
    for pdf in pdfs:
        loader = PyPDFLoader(pdf)
        docs.extend(loader.load())

    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_documents(docs)

    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    vectorstore = Chroma.from_documents(chunks, embeddings, persist_directory=CHROMA_DIR)
    print(f"✅ Vectorstore built with {len(chunks)} chunks")
    return vectorstore

def load_vectorstore():
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    return Chroma(persist_directory=CHROMA_DIR, embedding_function=embeddings)
if __name__ == "__main__":
    build_vectorstore()