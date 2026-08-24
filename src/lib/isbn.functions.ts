import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type ResultadoIsbn = {
  encontrado: boolean;
  fonte?: "google_books" | "open_library";
  erro?: string;
  dados?: {
    titulo?: string;
    autor?: string;
    editora?: string;
    ano?: string;
  };
};

type GoogleBooksResposta = {
  items?: {
    volumeInfo?: {
      title?: string;
      subtitle?: string;
      authors?: string[];
      publisher?: string;
      publishedDate?: string;
    };
  }[];
};

type OpenLibraryVolume = {
  title?: string;
  authors?: { name?: string }[];
  publishers?: { name?: string }[];
  publish_date?: string;
};

async function buscarGoogleBooks(isbn: string): Promise<ResultadoIsbn | null> {
  const chave = process.env["GOOGLE_BOOKS_API_KEY"];
  const url =
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}` +
    (chave ? `&key=${encodeURIComponent(chave)}` : "");

  const resposta = await fetch(url, { headers: { Accept: "application/json" } });
  if (!resposta.ok) {
    // 429 = cota anônima esgotada para o IP do servidor; cai no fallback.
    return null;
  }
  const json = (await resposta.json()) as GoogleBooksResposta;
  const info = json.items?.[0]?.volumeInfo;
  if (!info?.title) return null;

  return {
    encontrado: true,
    fonte: "google_books",
    dados: {
      titulo: info.subtitle ? `${info.title}: ${info.subtitle}` : info.title,
      autor: info.authors?.length ? info.authors.join(", ") : undefined,
      editora: info.publisher,
      ano: info.publishedDate?.slice(0, 4),
    },
  };
}

async function buscarOpenLibrary(isbn: string): Promise<ResultadoIsbn | null> {
  const resposta = await fetch(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(isbn)}&format=json&jscmd=data`,
    { headers: { Accept: "application/json" } },
  );
  if (!resposta.ok) return null;
  const json = (await resposta.json()) as Record<string, OpenLibraryVolume>;
  const volume = json[`ISBN:${isbn}`];
  if (!volume?.title) return null;

  const anoMatch = volume.publish_date?.match(/\d{4}/);
  return {
    encontrado: true,
    fonte: "open_library",
    dados: {
      titulo: volume.title,
      autor: volume.authors
        ?.map((a) => a.name)
        .filter(Boolean)
        .join(", "),
      editora: volume.publishers?.[0]?.name,
      ano: anoMatch?.[0],
    },
  };
}

export const buscarPorIsbn = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        isbn: z.string().transform((v) => v.replace(/[^0-9Xx]/g, "").toUpperCase()),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<ResultadoIsbn> => {
    const isbn = data.isbn;
    if (isbn.length !== 10 && isbn.length !== 13) {
      return { encontrado: false, erro: "ISBN deve ter 10 ou 13 dígitos." };
    }

    try {
      const google = await buscarGoogleBooks(isbn);
      if (google) return google;
    } catch (erro) {
      console.error("[isbn] google books falhou", erro);
    }

    try {
      const openLibrary = await buscarOpenLibrary(isbn);
      if (openLibrary) return openLibrary;
    } catch (erro) {
      console.error("[isbn] open library falhou", erro);
    }

    return {
      encontrado: false,
      erro: "Nenhum catálogo retornou dados para este ISBN.",
    };
  });
