
import AdminLayout from '../components/AdminLayout';
import { useCensus } from '../context/CensusContext';

export default function ActivityLogs() {
    const { logs } = useCensus();

    return (
        <AdminLayout
            active="/admin/activity-logs"
            title="Activity Logs"
            subtitle="Recent actions saved in the MySQL database."
        >
            <div className="data-card">
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Time</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Module</th>
                                <th>Record</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {logs.length === 0 ? <tr><td colSpan="7" className="text-center text-secondary py-4">No activity logs found.</td></tr> : logs.map((l) => (
                                <tr key={l.id}>
                                    <td>{l.date}</td>
                                    <td>{l.time}</td>
                                    <td>{l.user}</td>
                                    <td>{l.action}</td>
                                    <td>{l.module}</td>
                                    <td>{l.record}</td>
                                    <td>
                                        <span className="badge text-bg-success">
                                            {l.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}

