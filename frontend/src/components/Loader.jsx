const Loader = ({ full = false }) => (
  <div className={`flex items-center justify-center ${full ? "min-h-[60vh]" : "py-12"}`}>
    <div className="w-10 h-10 rounded-full border-2 border-stone-200 border-t-forest-700 animate-spin" />
  </div>
);

export default Loader;
