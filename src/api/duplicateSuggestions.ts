import { apiRequest } from "./client";

export interface DuplicateSuggestionItem {
	id: string;
	title: string;
	year: number | null;
	path: string;
}

export interface DuplicateSuggestion {
	libraryId: string;
	type: string;
	kind: "providerId" | "fileHash";
	provider: string;
	providerId: string;
	itemCount: number;
	itemsTruncated: boolean;
	items: DuplicateSuggestionItem[];
}

export interface DuplicateSuggestionsPage {
	items: DuplicateSuggestion[];
	total: number;
	page: number;
	size: number;
}

export async function listDuplicateSuggestions(page = 1, size = 25): Promise<DuplicateSuggestionsPage> {
	const response = await apiRequest<DuplicateSuggestionsPage>({
		method: "GET",
		url: "/admin/media/duplicate-suggestions",
		params: { page, size },
	});
	return response.data;
}
