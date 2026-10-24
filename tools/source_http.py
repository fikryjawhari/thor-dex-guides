"""Retry byte reads for source fetchers with caller-specific network policies."""
import time, urllib.request


def fetch_bytes(url, *, headers, timeout, attempts, delay):
    """Read a URL, sleeping after every failure; print FAIL and return None on exhaustion."""
    for attempt in range(attempts):
        try:
            request = urllib.request.Request(url, headers=headers)
            return urllib.request.urlopen(request, timeout=timeout).read()
        except Exception as error:
            last_error = error
            time.sleep(delay(attempt))
    print("FAIL", url, last_error, flush=True)
    return None
