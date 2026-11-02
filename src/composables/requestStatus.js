export function requestStatusLabelKey(status) {
    return status === 'none' ? '' : `requests.cardStatus.${status}`;
}
