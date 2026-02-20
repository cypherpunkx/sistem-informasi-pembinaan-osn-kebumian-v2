"use client";

export default function ShareButton({ title }: { title: string }) {
  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          url: window.location.href,
          text: title,
        });
      } catch {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  }

  function copyToClipboard() {
    void navigator.clipboard.writeText(window.location.href);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-warm/30 text-sm font-medium text-text-dark hover:bg-neutral-light hover:border-accent-earthy/30"
    >
      Share
    </button>
  );
}
