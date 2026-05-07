import { Menubar } from 'primereact/menubar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/useAuth';


const DashboardMenu = () => {
    const { hasPageAccess,hasActionAccess } = useAuth();
        const Task_PAGE_KEY = "task_dashboard";
        const User_Task_PAGE_KEY = "user_task_dashboard_tab";


    const navigate = useNavigate();
    const dashboards = [
        
        hasPageAccess(Task_PAGE_KEY) &&{
            label: 'Task Dashboard',
            icon: 'fa-solid fa-user',
            command: () => navigate("/task-dashboard"),
            className: location.pathname === `/task-dashboard` ? 'active-menu-item' : ''
        },
        hasActionAccess("task_dashboard", "user_task_dashboard_tab") && {
    label: 'User Task Dashboard',
    icon: 'fa-solid fa-user',
    command: () => navigate("/user-task-dashboard"),
    className: location.pathname === `/user-task-dashboard` ? 'active-menu-item' : ''
}
      
        
    ].filter(Boolean);
    return (
        <>
            <div className="card pl-0 pr-0 pb-0 pt-0 -mt-4" >
                <Menubar model={dashboards} style={{padding:'0.1rem'}}/>
            </div>
        </>
    )
}


export default DashboardMenu;