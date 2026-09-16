/**
 * Role permissions, derived from app/security.py and app/routers/*.py.
 * "own" means "only on your own records — enforced by object-level checks".
 */
export type Access = "✓" | "✗" | "own" | "own-pending" | "public";

export interface RoleRow {
  role: string;
  note: string;
  actions: Record<string, Access>;
}

/** Action labels shared with RoleMatrix diagram. */
export const actionLabels: Record<string, string> = {
  signup: "Signup",
  login: "Login",
  me: "Auth /me",
  createSlot: "Open slot",
  list: "List bookings",
  read: "Read booking",
  updateSlot: "Reschedule",
  deleteSlot: "Delete slot",
  book: "Book slot",
  complete: "Complete",
  createReview: "Review",
  summarize: "Summarize",
};

export const roles: RoleRow[] = [
  {
    role: "admin",
    note: "Sees everything, manages every booking.",
    actions: {
      signup: "public",
      login: "public",
      me: "✓",
      createSlot: "✗",
      list: "✓",
      read: "✓",
      updateSlot: "✓",
      deleteSlot: "✓",
      book: "✗",
      complete: "✓",
      createReview: "✗",
      summarize: "✗",
    },
  },
  {
    role: "provider",
    note: "Owns slots: opens, lists, reschedules, deletes, completes.",
    actions: {
      signup: "public",
      login: "public",
      me: "✓",
      createSlot: "✓",
      list: "own",
      read: "own",
      updateSlot: "own-pending",
      deleteSlot: "own-pending",
      book: "✗",
      complete: "own",
      createReview: "✗",
      summarize: "✗",
    },
  },
  {
    role: "customer",
    note: "Discovers slots, books, completes nothing, reviews own completed bookings.",
    actions: {
      signup: "public",
      login: "public",
      me: "✓",
      createSlot: "✗",
      list: "own",
      read: "own",
      updateSlot: "✗",
      deleteSlot: "✗",
      book: "✓",
      complete: "✗",
      createReview: "own",
      summarize: "own",
    },
  },
];