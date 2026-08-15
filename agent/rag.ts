export type Source = {
  documentId: string;
  title: string;
  section?: string;
};

export type RetrievedContext = {
  content: string;
  source: Source;
};

export async function retrieveContext(
  query: string
): Promise<RetrievedContext[]> {
  console.log('Retrieving context for:', query);

  return [];
}