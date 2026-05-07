import { Menubar } from 'primereact/menubar';
import { useAuth } from '../../../store/useAuth'; //  import hook

import { useNavigate,useParams,useLocation  } from 'react-router-dom';
const OrderMenu = () => {
    const navigate = useNavigate();
    const params = useParams();
    const location = useLocation();
    const { hasPageAccess } = useAuth(); 

    const dashboards = [
        hasPageAccess("order_details") &&{
            label: 'Order Detail',
            icon: 'fa-solid fa-water',
            command: () => navigate("/outbound/orders-import/"+params.id+'/'+params.pick_list_id),
            className: location.pathname === `/outbound/orders-import/${params.id}/${params.pick_list_id}` ? 'active-menu-item' : ''
        },
        hasPageAccess("order_task") &&{
            label: 'Order Task',
            icon: 'fa-regular fa-chart-bar',
            command: () => navigate("/outbound/orders-import/order-task/"+params.id+'/'+params.pick_list_id),
            className: location.pathname === `/outbound/orders-import/order-task/${params.id}/${params.pick_list_id}` ? 'active-menu-item' : ''
        },
        // {
        //     label: 'Order Item',
        //     icon: 'fa-regular fa-chart-bar',
        //     command: () => navigate("/outbound/orders-import/order-item/"+params.id+'/'+params.pick_list_id),
        //     className: location.pathname === `/outbound/orders-import/order-item/${params.id}/${params.pick_list_id}` ? 'active-menu-item' : ''
        // },
        hasPageAccess("Pallet_image") &&{
            label: 'Pallet Image',
            icon: 'fa-regular fa-image',
            command: () => navigate("/outbound/orders-import/pallet-image/"+params.id+'/'+params.pick_list_id),
            className: location.pathname === `/outbound/orders-import/pallet-image/${params.id}/${params.pick_list_id}` ? 'active-menu-item' : ''
        },
        
    ].filter(Boolean);
    return (
        <>
            <div className="card pl-0 pr-0 pb-0 pt-0 -mt-4" >
                <Menubar model={dashboards} style={{padding:'0.1rem'}}/>
            </div>
        </>
    )
}


export default OrderMenu;