import { Menubar } from 'primereact/menubar';
import { useNavigate,useParams,useLocation  } from 'react-router-dom';
const CancelOrderMenu = () => {
    const navigate = useNavigate();
    const params = useParams();
    const location = useLocation();
    const dashboards = [
        {
            label: 'Order Item',
            icon: 'fa-regular fa-chart-bar',
            command: () => navigate("/outbound/cancel-order/order-item/"+params.id+'/'+params.pick_list_id),
            className: location.pathname === `/outbound/cancel-order/order-item/${params.id}/${params.pick_list_id}` ? 'active-menu-item' : ''
        }
        
    ];
    return (
        <>
            <div className="card pl-0 pr-0 pb-0 pt-0 -mt-4" >
                <Menubar model={dashboards} style={{padding:'0.1rem'}}/>
            </div>
        </>
    )
}


export default CancelOrderMenu;