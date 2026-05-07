
import React, { useState, useEffect , useRef} from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link, useParams,useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { MultiSelect } from 'primereact/multiselect';
import { Menu } from 'primereact/menu';
import { Sidebar } from 'primereact/sidebar';
import { Timeline } from 'primereact/timeline';
import { GeneralService } from '../../../../service/inbound/GeneralService';
import { Dialog } from 'primereact/dialog';
import { OrdersReAllocateService } from '../../../../service/outbound/OrderReallocateService';
import { Badge } from 'primereact/badge';
import { TabView, TabPanel } from 'primereact/tabview';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { UserSettingService } from '../../../../service/settings/UserSettingService';
import { useLazySort } from '../../../../components/useLazySort';
import { useAuth } from '../../../../store/useAuth';

export default function PickListDetails() {
    const {hasActionAccess} = useAuth();
    const PAGE_KEY = "outbound_orderReAllocation";
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [usersDropdownlist, setUsersDropdownlist] = useState(null);
    const [stock, setStock] = useState(null);
    const [pickListLines, setPickListLines] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedPickListLines, setSelectedPickListLines] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [palletSelectedUser, setPalletSelectedUser] = useState(null);
    const [btnDisabled, setbtnDisabled] = useState(true);
    const menuLeft = useRef(null);
    const [selectedStockQty, setSelectedStockQty] = useState(0);
  
    const [displayConfirmation7, setDisplayConfirmation7] = useState(false);
   
    const navigate = useNavigate();
    const exportFlags = [
        { code: '1', name: 'Success' },
        { code: '2', name: 'Failed' },
        { code: '3', name: 'Skipped' },
        { code: '4', name: 'Unexportable' },
        { code: '0', name: 'Pending' }
    ];
 

    useEffect(() => {
        if (!Array.isArray(stock)) return;
      
        const selectedStocks = stock.filter(s => palletSelectedUser?.includes(s.stockId));
      
        const extractQty = (info) => {
          const match = info.match(/Qty:\s*(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        };
      
        const totalQty = selectedStocks.reduce((sum, item) => {
          return sum + extractQty(item.info);
        }, 0);
      
        setSelectedStockQty(totalQty);
      }, [palletSelectedUser, stock]);

      const extractQty = (info) => {
        const match = info.match(/Qty:\s*(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      }

      const optionDisabled = (option) => {
        const info = option.info;
        const optionQty = extractQty(info);
        const isAlreadySelected = palletSelectedUser?.includes(option.stockId);
    
        // Extract SSCC from info
        const ssccMatch = info.match(/\(SSCC:\s*(.*?)\)/);
        const sscc = ssccMatch ? ssccMatch[1].trim() : '';
    
        const currentTotal = stock
          .filter(s => palletSelectedUser?.includes(s.stockId))
          .reduce((sum, s) => sum + extractQty(s.info), 0);
    
        const maxQty = selectedPickListLines?.quantity ?? 0;
    
        // Always allow already-selected stock
        if (isAlreadySelected) return false;
    
        // If total >= maxQty, disable all options
        if (currentTotal >= maxQty) return true;
    
        // If SSCC is empty and we're still under the limit, allow it
        if (sscc === '') return false;
    
        // Otherwise, disable if this would exceed the limit
        return currentTotal + optionQty > maxQty;
      };

      const sortedStock = (stock || []).sort((a, b) => {
        // Check if 'stock' is null or undefined, return an empty array if it is
        if (!stock) return [];
      
        const isDisabledA = optionDisabled(a); // Check if 'a' is disabled
        const isDisabledB = optionDisabled(b); // Check if 'b' is disabled
      
        // If both are disabled or both are enabled, maintain their order
        if (isDisabledA === isDisabledB) return 0;
      
        // Otherwise, move disabled options to the end
        return isDisabledA ? 1 : -1;
      });
    const flagTemplate = (option) => {
        return <Badge value={option.name} severity={getSeverity(option.name)} />;
    };

    const getSeverity = (flag) => {
        switch (flag) {
            case 'Yes':
                return 'danger';

            case 'No':
                return 'success';
        }
    };
    const params = useParams();
    const toast = useRef();
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: null,
        sortOrder: null,
        code:params.pick_list_id,
        filters: {
            quantity: { value: '', matchMode: 'contains' },
            productCode: { value: '', matchMode: 'contains' },
        }
    });

   
    const { onSort } = useLazySort(setlazyState);
    let networkTimeout = null;
 
  
   

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
            OrdersReAllocateService.getOrderShipItems((lazyState)).then((data) => {
                setTotalRecords(data.totalRecords);
                setPickListLines(data.data);
                setLoading(false);
            });
        }, Math.random() * 100 + 350);
        UserSettingService.getMantisUsers().then((data) => {
            setLoading(false);
            if (data.error === 0 && Array.isArray(data.data)) {
                const formattedUsers = data.data.map(user => ({
                    emp_ID: user.emp_ID || user.id,
                    Name: user.name || user.username
                }));
                setUsersDropdownlist(formattedUsers);
            } else {
                console.error("Invalid response:", data);
            }
        });

    };

    const onPage = (event) => {
       setlazyState((prevState) => ({
            ...prevState,
            first: event.first,
            rows: event.rows,
            page: event.page + 1,
        }));
    };

    const onFilter = (event) => {
        event['first'] = 0;
        setlazyState(event);
    };

    const onSelectionChange = (event) => {
        const value = event.value;

        setSelectedPickListLines(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;
       
        if (selectAll) {
            
            setSelectAll(true);
            setSelectedPickListLines(pickListLines);
            
        } else {
            setSelectAll(false);
            setSelectedPickListLines([]);
        }
    };

   
    const actionItems = [
        {
            label: 'Assign User and Stock',
            icon: 'pi pi-user',
            command: () => {
                
                if(selectedPickListLines != null){

                    const data =selectedPickListLines.ori_ProductID;
                    OrdersReAllocateService.getStockDetails(data).then((data) => {
                        setLoading(false);
                        if(data.error == 0){
                            setStock(data.data);
                        }
                    });
                    setSelectedUser(null)
                    setPalletSelectedUser(null);     
                    setbtnDisabled(true) 

                    setDisplayConfirmation7(true)
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Select atleast 1 order line' });
                }
            }
        }
        
    ];


    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
               
                <Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" />
                <Button label="Actions" icon="pi pi-align-left" className="mr-2" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup />      
            </span>
        </div>
    )


    
    useEffect(() => {
        const isUserSelected = selectedUser !== null;
        const isStockSelected = palletSelectedUser && palletSelectedUser.length > 0;
        setbtnDisabled(!(isUserSelected && isStockSelected));
    }, [selectedUser, palletSelectedUser]);
    const confirmationDialogFooter7 = (
        <div>
            <Button label="Submit" disabled={btnDisabled}   icon="pi pi-check" onClick={() => onSubmitUserLoc()} />
        </div>
    );
    const onSubmitUserLoc = () => {
        
        setbtnDisabled(true);
        setLoading(true);


        const data = {
            user: selectedUser,
            stockID: palletSelectedUser,
            orderShipmentID: selectedPickListLines.orderShipItemId,
        }
       
        OrdersReAllocateService.orderReallocation( (data) ).then((data) => {
            setDisplayConfirmation7(false)
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
                setSelectAll(false);
                setSelectedPickListLines(null)
                loadLazyData();
                
            } 
            
            else{
                setSelectAll(false);
                setSelectedPickListLines(null)
                setbtnDisabled(false);
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
            }
            setbtnDisabled(false);
            setDisplayConfirmation7(false)
        });
        
    };
    return (
        <>
        <Toast ref={toast} />
        <Button
            label="Back"
            icon="pi pi-arrow-left"
            className="p-button-primary"
            onClick={() => navigate("/outbound/orders-reallocation")} 
            style={{ margin: '10px 0' }}
        />
        <Dialog header="Assign User And Stock" visible={displayConfirmation7} style={{ width: '50vw' }} 
        onHide={() => setDisplayConfirmation7(false)} footer={confirmationDialogFooter7}>
                <div className="p-fluid formgrid grid">
                    <div className="field col-12 md:col-9">
                        <label className='pl-3'>Asign User*</label>
                        <Dropdown 
                            style={{marginRight:5, marginLeft:10}} 
                            value={selectedUser}
                            optionValue="emp_ID" 
                            optionLabel="Name" 
                            onChange={(e) => {
                                setSelectedUser(e.value)                                  
                            }} 
                            options={usersDropdownlist} 
                            placeholder="Select User"  
                            filter={true}
                        />
                    </div>
                  
                    <div className="field col-12 md:col-9">
                        <label className='pl-3'>Stock *</label>
                        <MultiSelect
                        style={{marginRight:5, marginLeft:10}} 
                                value={palletSelectedUser} 
                                options={sortedStock}
                                optionValue="stockId" 
                                optionLabel="info"
                                onChange={(e) => {
                                    setPalletSelectedUser(e.value)             
                                }}  
                                filter
                                placeholder="Select Stock"
                                maxSelectedLabels={3}
                                optionDisabled={optionDisabled} // Use the optionDisabled function
                                                           />
                        {/* <Dropdown 
                            style={{marginRight:5, marginLeft:10}} 
                            value={palletSelectedUser}
                            optionValue="stockId" 
                            optionLabel="info" 
                            onChange={(e) => {
                                setPalletSelectedUser(e.value)     
                                setbtnDisabled(false)                           
                            }} 
                            options={stock} 
                            placeholder="Select Stock" 
                        /> */}
                    </div>
                    <h1 className="ml-6 text-right">{selectedStockQty}/{selectedPickListLines?.quantity ?? 'N/A'}</h1>

                </div>
            </Dialog>
            {/* <BreadCrumb model={items} home={home} /> */}
            <h1></h1>

    
            <div className="card">
                
                <h3>Order Item</h3>
                <DataTable
                    value={pickListLines}
                    lazy
                    filterDisplay="row"
                    dataKey="orderShipItemId"
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
                    emptyMessage="No Pending task found."
                    selection={selectedPickListLines}
                    onSelectionChange={onSelectionChange}
                    selectAll={selectAll}
                    onSelectAllChange={onSelectAllChange}
                    scrollable
                    header={header}
                    scrollHeight="600px"
                >
                    <Column selectionMode="single" headerStyle={{ width: '3rem' }} />

                    <Column field="productCode" header="Item"  body={(rowData) => rowData.productCode}  />
                    <Column field="prdl_Description" header="Description"  body={(rowData) => rowData.productDescription}  />
                    <Column field="quantity" header="QTY"  body={(rowData) => rowData.quantity}  />
                    <Column field="orderStatus" sortable  header="Status"  body={(rowData) => rowData.orderStatus}  />
                </DataTable>
            </div>
        </>

    );
}
