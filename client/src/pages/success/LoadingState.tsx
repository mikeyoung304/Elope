/**
 * LoadingState - Displays loading spinner while booking details are being fetched
 */
export function LoadingState() {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center gap-3 text-macon-navy-100">
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        <p className="text-lg">Loading booking details...</p>
      </div>
    </div>
  );
}
