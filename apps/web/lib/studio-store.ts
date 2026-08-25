export interface StudioDocumentMetadata {
  readonly documentId: string;
  readonly title: string;
  readonly currentRevision: number;
  readonly updatedAt: number;
  readonly cloud?: boolean;
  readonly cloudVersion?: number;
}

export interface StudioDraft extends StudioDocumentMetadata {
  readonly source: string;
}

interface StudioRevision {
  readonly documentId: string;
  readonly revision: number;
  readonly source: string;
  readonly createdAt: number;
}

const DATABASE_NAME = "animflow-studio";
const DATABASE_VERSION = 1;
const DOCUMENTS = "documents";
const REVISIONS = "revisions";

export async function listStudioDocuments(): Promise<readonly StudioDocumentMetadata[]> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(DOCUMENTS, "readonly");
    const documents = await requestValue<StudioDocumentMetadata[]>(
      transaction.objectStore(DOCUMENTS).getAll(),
    );
    await transactionComplete(transaction);
    return documents.sort((left, right) => right.updatedAt - left.updatedAt);
  } finally {
    database.close();
  }
}

export async function loadStudioDraft(documentId: string): Promise<StudioDraft | undefined> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction([DOCUMENTS, REVISIONS], "readonly");
    const metadata = await requestValue<StudioDocumentMetadata | undefined>(
      transaction.objectStore(DOCUMENTS).get(documentId),
    );
    if (!metadata) return undefined;
    const revision = await requestValue<StudioRevision | undefined>(
      transaction.objectStore(REVISIONS).get([documentId, metadata.currentRevision]),
    );
    await transactionComplete(transaction);
    return revision ? { ...metadata, source: revision.source } : undefined;
  } finally {
    database.close();
  }
}

export async function saveStudioDraft(draft: StudioDraft): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction([DOCUMENTS, REVISIONS], "readwrite");
    transaction.objectStore(REVISIONS).put({
      documentId: draft.documentId,
      revision: draft.currentRevision,
      source: draft.source,
      createdAt: draft.updatedAt,
    } satisfies StudioRevision);
    transaction.objectStore(DOCUMENTS).put({
      documentId: draft.documentId,
      title: draft.title,
      currentRevision: draft.currentRevision,
      cloud: draft.cloud,
      cloudVersion: draft.cloudVersion,
      updatedAt: draft.updatedAt,
    } satisfies StudioDocumentMetadata);
    await transactionComplete(transaction);
  } catch (error) {
    if (isQuotaError(error)) {
      throw new Error("Browser storage is full. Export the source or delete an older draft.");
    }
    throw error;
  } finally {
    database.close();
  }
}

export async function deleteStudioDraft(documentId: string): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction([DOCUMENTS, REVISIONS], "readwrite");
    transaction.objectStore(DOCUMENTS).delete(documentId);
    const revisions = transaction.objectStore(REVISIONS).index("by-document");
    const keys = await requestValue<IDBValidKey[]>(revisions.getAllKeys(documentId));
    for (const key of keys) transaction.objectStore(REVISIONS).delete(key);
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(DOCUMENTS)) {
        database.createObjectStore(DOCUMENTS, { keyPath: "documentId" });
      }
      if (!database.objectStoreNames.contains(REVISIONS)) {
        const store = database.createObjectStore(REVISIONS, { keyPath: ["documentId", "revision"] });
        store.createIndex("by-document", "documentId");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open browser storage."));
  });
}

function requestValue<Value>(request: IDBRequest<Value>): Promise<Value> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Browser storage request failed."));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error("Browser storage transaction aborted."));
    transaction.onerror = () => reject(transaction.error ?? new Error("Browser storage transaction failed."));
  });
}

function isQuotaError(error: unknown): boolean {
  return error instanceof DOMException && (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED");
}
