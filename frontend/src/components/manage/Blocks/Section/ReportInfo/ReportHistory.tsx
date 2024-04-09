const ReportHistory = () => {
  return (
    <div>
      <p className="mb-3 text-2xl font-normal">History</p>
      <div className="flex flex-col flex-wrap justify-center gap-2 rounded-lg bg-white px-4 py-1 shadow-lg">
        {[...Array(3)].map((_, index) => {
          const randomDate = new Date(
            +new Date() - Math.floor(Math.random() * 10000000000),
          )
          return (
            <div
              key={index}
              className="flex grow items-center justify-between gap-3 text-pretty"
            >
              <div className="flex items-center gap-2">
                <p
                  id={`report_date_${index}`}
                  className="my-1 min-w-24 text-right text-sm font-normal text-gray-500"
                >
                  {randomDate.toDateString()}
                </p>
                <p
                  id={`report_summary_${index}`}
                  className="text-md my-1 font-medium text-gray-900"
                >
                  Report commentary {index}
                </p>
              </div>
              <div>
                <p
                  id={`report_user_${index}`}
                  className="my-1 w-fit rounded bg-gray-100 px-1 text-sm font-normal text-gray-500"
                >
                  Reported by user {index}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default ReportHistory;
