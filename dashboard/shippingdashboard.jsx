
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link, useNavigate,useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Helmet } from 'react-helmet';
import { Toast } from 'primereact/toast';
import { Menu } from 'primereact/menu';  
import { useDispatch, useSelector } from 'react-redux';
import { DashboardService } from '../../service/DashboardService';
import { useLazySort } from "../../components/useLazySort";
import { useAuth } from '../../store/useAuth';


export default function Users() {
   const {hasActionAccess} = useAuth();
    const PAGE_KEY = "shipping_dashboard";
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [order, setOrder] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState(null);
    const toast = useRef();
    const menuLeft = useRef(null);  
    const navigate = useNavigate();
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 0,
        sortField: "",
        sortOrder: "",
        filters: {

            slots: { value: null, matchMode: 'contains' },
            orderCode: { value: null, matchMode: 'contains' },
        }
    });
    const params = useParams();
    const formMessageDetail = useSelector((state) => state.formMessage.detail)
    const formMessageSeverity = useSelector((state) => state.formMessage.severity)
    const formMessageSummary = useSelector((state) => state.formMessage.summary)
    const dispatch = useDispatch()

    const { onSort } = useLazySort(setlazyState);
    
    let networkTimeout = null;

 const items = [{ label: 'Conveyor' }, { label: 'Shipping Conveyor'}];
    const home = { icon: 'pi pi-home', url: '/' }
    useEffect(() => {
        
        loadLazyData();
    }, [lazyState]);

    const loadLazyData = () => {
        setLoading(true);

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        //imitate delay of a backend call
        networkTimeout = setTimeout(() => {
            DashboardService.getShippingConveyor( (lazyState) ).then((data) => {
                setTotalRecords(data.totalRecords);
                setOrder(data.data);
                setLoading(false);
            });
        }, Math.random() * 100 + 250);
    };

    const onPage = (event) => {
        setlazyState(event);
    };

    const onFilter = (event) => {
        event['first'] = 0;
        setlazyState(event);
    };


    const onSelectionChange = (event) => {
        const value = event.value;

        setSelectedUsers(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;
    };
    const Refresh=()=>{
        loadLazyData();
    };
    const actionItems = [
      
        hasActionAccess(PAGE_KEY, "order_slot") &&{
            label: 'Order Slot',
            icon: 'fa-solid fa-check-to-slot',
            command: () => {
                navigate("/conveyor/order-slot")
                
            }
            
        },
        
    ].filter(Boolean);
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
             <Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" />
              {actionItems.length > 0 && (<Button label="Actions" icon="pi pi-align-left" className="p-2  align-item-right" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup
                />)}
           </div>
          
        )

    return (
        <>

     
        <div className="flex flex-row-reverse flex-wrap">
            <div className="flex align-items-center justify-content-center">
                <Button 
                label="Refresh" 
                loading={loading} 
                onClick={Refresh} 
                severity="success" 
                icon="pi pi-refresh" 
                className="align-item-right mb-2"
                size="small" 
            />
                </div>
                
        </div>
        <BreadCrumb model={items} home={home} />
        <div className="card mt-4">
            <h3>Shipping Conveyor Dashboard</h3>
            <DataTable 
                value={order} 
                lazy 
                filterDisplay="row" 
                dataKey="id" 
                paginator
                showGridlines
                first={lazyState.first} 
                rows={lazyState.rows} 
                totalRecords={totalRecords} 
                onPage={onPage}
                onSort={onSort} 
                size={'small'}
                sortField={lazyState.sortField}    
                className="datatable-responsive"
                sortOrder={lazyState.sortOrder}
                onFilter={onFilter} 
                filters={lazyState.filters} 
                rowsPerPageOptions={[25, 50, 100, 500, 1000]}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                loading={loading} 
                tableStyle={{ minWidth: '75rem' }}
                emptyMessage="No records found."
                selection={selectedUsers} 
                onSelectionChange={onSelectionChange} 
                selectAll={selectAll} 
                onSelectAllChange={onSelectAllChange}
                scrollable 
                header={header}
                scrollHeight="600px"
            >

                <Column field="slots" header="Slot" body={(rowData) => rowData.slots} filterMenuStyle={{ width: '14rem' }} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="orderCode" header="Order Code" body={(rowData) => rowData.orderCode} filterMenuStyle={{ width: '14rem' }} sortable showFilterMenu={false} filter filterPlaceholder="Search"  />
                <Column field="orderQuantity" sortable header="Order Quantity"  body={(data) => data.orderQuantity }  />
                <Column field="packedQuantity" sortable header="Packed Quantity" body={(data) => data.packedQuantity }  />
                <Column field="slotQuantity" sortable header="Slot Quantity"  body={(data) => data.slotQuantity }  />
            </DataTable>
        </div>
        </>
        
    );
}
        