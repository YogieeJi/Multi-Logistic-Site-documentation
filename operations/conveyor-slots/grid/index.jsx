
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Helmet } from 'react-helmet';
import { Toast } from 'primereact/toast';
import { useDispatch, useSelector } from 'react-redux';
import { removeData } from "../../../../store/formMessage.slice"
import { ConveyorSlotsService } from '../../../../service/operations/ConveyorSlotsService';
import { useLazySort } from "../../../../components/useLazySort";
import { useAuth } from '../../../../store/useAuth';



export default function ConveyorSlots() {

    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [slots, setSlots] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedSlots, setSelectedSlots] = useState(null);
    const toast = useRef();
    const navigate = useNavigate();
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            title: { value: null, matchMode: 'contains' },
            lane: { value: null, matchMode: 'contains' },
            mantis_location_id: { value: null, matchMode: 'contains' },
            ip: { value: null, matchMode: 'contains' },
            ptl_address: { value: null, matchMode: 'contains' },
        }
    });
        const { onSort } = useLazySort(setlazyState);
        const { hasActionAccess, hasPageAccess } = useAuth();
        
   const PAGE_KEY = "operations_conveyorSlots";
  const Detail_PAGE_KEY = "Conveyor_Slots_details";
    const formMessageDetail = useSelector((state) => state.formMessage.detail)
    const formMessageSeverity = useSelector((state) => state.formMessage.severity)
    const formMessageSummary = useSelector((state) => state.formMessage.summary)

    const dispatch = useDispatch()


    const items = [{ label: 'Conveyor' }, { label: 'Conveyor Slots'}];
    const home = { icon: 'pi pi-home', url: '/' }

    let networkTimeout = null;

    useEffect(() => {
        if(formMessageDetail != ''){
            toast.current.show({ severity: formMessageSeverity, summary: formMessageSummary, detail: formMessageDetail});
            dispatch(removeData());
        }
        loadLazyData();
    }, [lazyState]);

    const loadLazyData = () => {
        setLoading(true);

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        networkTimeout = setTimeout(() => {
            ConveyorSlotsService.getSlotGrid( (lazyState) ).then((data) => {
                setTotalRecords(data.totalRecords);
                setSlots(data.data);
               
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

        setSelectedSlots(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            ConveyorSlotsService.getSlotGrid().then((data) => {
                setSelectAll(true);
                setSelectedSlots(data.shipments);
            });
        } else {
            setSelectAll(false);
            setSelectedSlots([]);
        }
    };

    const titleBodyTemplate = (rowData) => {
        return (
            <>
                <Link to={`${rowData.id}`}>{rowData.title}</Link>
            </>
        );
    };

    const lane_idBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.lane}
            </>
        );
    };
    const ipBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.ip}
            </>
        );
    };
    const PTLAddressBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.ptl_address}
            </>
        );
    };

    const mantis_location_idBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.mantis_location_id}
            </>
        );
    };
   
    const actionBodyTemplate = (rowData) => {
        return (
            <div className='flex gap-2 justify-content-center'>
                <Button icon="pi pi-pencil" rounded severity="success" aria-label="Search" onClick={() => navigate("/conveyor/conveyor-slots/edit/"+rowData.id)} />
                
            </div>
        );
    };
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                {hasActionAccess(PAGE_KEY, "add_slot") &&(<Button label="Add Slot" icon="pi pi-plus" severity="sucess" onClick={() => navigate("/conveyor/conveyor-slots/add")} />)}
            </span>
        </div>
    );

    return (
        <>
        <Helmet>
            <title>Conveyor Slots</title>
        </Helmet>
        <Toast ref={toast} />
        <BreadCrumb model={items} home={home} />
        
        <h1></h1>
        <div className="card">
            <h3>Conveyor Slots</h3>
            <DataTable 
                value={slots} 
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
                header={header}
                scrollable 
                scrollHeight="600px"
                
            >
                
           
                <Column field="title" header="Title" body={titleBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                <Column field="lane" sortable header="Lane" body={lane_idBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="mantis_location_id" sortable header="Mantis Location ID" body={mantis_location_idBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="ip" sortable header="PTL IP" body={ipBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="ptl_address" sortable header="PTL Address" body={PTLAddressBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                {hasActionAccess(PAGE_KEY, "edit_slot") &&(<Column field="" header="Action" body={actionBodyTemplate} />)}
            </DataTable>
        </div>
        </>
        
    );
}
        