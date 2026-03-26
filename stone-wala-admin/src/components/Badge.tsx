export type BadgeStatus =
  | 'active'
  | 'blocked'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'failed';

const styles: Record<BadgeStatus, string> = {
  active:    'bg-green-100 text-green-700',
  approved:  'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
  blocked:   'bg-red-100 text-red-700',
  rejected:  'bg-red-100 text-red-700',
  failed:    'bg-red-100 text-red-700',
  pending:   'bg-amber-100 text-amber-700',
};

export default function Badge({ status }: { status: BadgeStatus }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}