---
"@syntara/react": patch
---

Tooltip: a tooltip no longer stays on the page after focus or hover moves straight to another tooltip's trigger. Before, each one stayed mounted at the top-left corner with `role="tooltip"`. Swapping between tooltips is still instant; the tooltip carries `data-instant` while it swaps. A tooltip whose trigger only had focus in passing (the last item of a toggle group, on Tab) no longer fades out after never appearing. A tooltip opened by keyboard focus stays open when that focus scrolls the page; a scroll you make still closes it.
