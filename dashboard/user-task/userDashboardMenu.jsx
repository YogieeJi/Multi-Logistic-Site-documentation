import { Menubar } from 'primereact/menubar';
import { useNavigate,useParams  } from 'react-router-dom';
const UserDashboardMenu = () => {
    const navigate = useNavigate();
    const params = useParams();
    const dashboards = [
        {
            label: 'User Detail',
            icon: 'fa-solid fa-user',
            command: () => navigate(`/user-task-dashboard/${params.id}/${params.name}/${params.date}`),
            className: location.pathname.includes('/user-task-dashboard') ? 'active-menu-item' : ''
        },
        {
            label: 'User Detail Task',
            icon: 'fa-solid fa-user',
            command: () => navigate(`/user-task-detail/${params.id}/${params.name}/${params.date}`),
            className: location.pathname.includes('/user-task-detail') ? 'active-menu-item' : ''
        },
        
    ];
    return (
        <>
            <div className="card pl-0 pr-0 pb-0 pt-0 -mt-4" >
                <Menubar model={dashboards} style={{padding:'0.1rem'}}/>
            </div>
        </>
    )
}


export default UserDashboardMenu;