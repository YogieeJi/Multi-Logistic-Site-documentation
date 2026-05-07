
import React, { useState, useEffect,useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ShipmentsService } from '../../../../service/inbound/ShipmentService';
import { Link, useParams,useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { CountService } from '../../../../service/Count/CountService';
import { MultiSelect } from 'primereact/multiselect';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { GeneralService } from '../../../../service/inbound/GeneralService';
import { Dialog } from 'primereact/dialog';
import { Badge } from 'primereact/badge';
import { Menu } from 'primereact/menu';
import { InputText } from 'primereact/inputtext';
import { ProgressSpinner } from 'primereact/progressspinner';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { classNames } from 'primereact/utils';
export default function ShipmentDetails() {
    const [loading, setLoading] = useState(false);
    const [formLoader, setFormLoader] = useState(false);
    const [isConveyableitemAttribute, setIsConveyableitemAttribute] = useState(2);
    const [error, setError] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [shipments, setShipments] = useState(null);
    const [shipmentDetail, setShipmentDetail] = useState({
        'created_at': '-',
        'fcy': '-'
    });
    const [btnDisabled, setbtnDisabled] = useState(false);
    const toast = useRef();
    const menuLeft = useRef(null);
    const [shipmentLines, setShipmentLines] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedShipments, setSelectedShipments] = useState(null);
    const [inputValue, setInputValue] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
        const [sector, setSector] = useState([]);
    const [level, setLevel] = useState([]); 
    const [loc, setLoc] = useState([]);
    const [side, setSide] = useState([]);
    const [product, setProduct] = useState([]);
    const [displayConfirmation7, setDisplayConfirmation7] = useState(false);
    const [item, setItem] =useState(() => {});
     const [selectedLocationLimit, setSelectedLocationLimit] = useState(3);
     const [itemData, setItemData] = useState([]);
     const [sqlQuery, setSqlQuery] = useState('');
     const [displayItemDialog, setDisplayItemDialog] = useState(false);
     const [displaySQLDialog, setDisplaySQLDialog] = useState(false);
 
     const [hasMore, setHasMore] = useState(true);

    const [dates, setDates] = useState(null);
    const [visibleRight, setVisibleRight] = useState(false);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 1,
        sortField: null,
        sortOrder: null,
        filters: {    
           
            loc_Code: { value: '', matchMode: 'contains' },
        }
    });

   

    const [logs, setLogs] = useState(null);
    const [visible, setVisible] = useState(false);
    const [dialogText, setDialogText] = useState('');

    const getSeverity = (status) => {
        switch (status) {
            case 1:
                return 'info';

            case 2:
                return 'warning';

            case 3:
                return 'success';
        }
    };

    const reactRouterLink = (label, url) => {
        return (<Link to={url}>{label}</Link>);
    }

    const items = [{ label: 'Inbound' }, { template: reactRouterLink('Shipments', '/inbound/shipments') }];
    const home = { icon: 'pi pi-home', url: '/' }

    let networkTimeout = null;
    const params = useParams();

    const logTopics = useState({
        moduleId: 1,
        subModuleId: 1,
        subjectId: params.id
    });

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);
    useEffect(() => {
        CountService.getLocationFilters().then(data => {
            if (data?.error === 0) {
                const formattedSectors = data.sectors
                    .filter(item => item != null) // removes null and undefined
                    .map(item => ({ label: item, value: item }));
        
                const formattedLevels = data.levels
                    .filter(item => item != null)
                    .map(item => ({ label: item, value: item }));
        
                setSide(formattedLevels);
                setLoc(formattedSectors);
            } else {
                console.error("Failed to fetch location filters", data);
            }
        });
    }, []);


    const loadLazyData = () => {
        setLoading(true);

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }
        const data = {
            lazyState:lazyState,
            countplanid:params.id
        }
        //imitate delay of a backend call
        networkTimeout = setTimeout(() => {
            CountService.getCountLocations((data)).then((data) => {
                setTotalRecords(data.totalRecords);
                setShipmentLines(data.data);
                setLoading(false);
            });
        }, Math.random() * 100 + 250);

    };

    const onPage = (event) => {
        setlazyState(event);
    };

    const onSort = (event) => {
        setlazyState(event);
    };

    const onFilter = (event) => {
        event['first'] = 0;
        setlazyState(event);
    };

    const onSelectionChange = (event) => {
        const value = event.value;
        setSelectedDelivery(value);
        setSelectedShipments(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            ShipmentsService.getShipmentLines(params.id).then((data) => {
                setSelectAll(true);
                setSelectedShipments(data.shipments);
            });
        } else {
            setSelectAll(false);
            setSelectedShipments([]);
        }
    };

    const onSubmitLoc = () => {
         setLoading(true);
         setbtnDisabled(true);
        const data ={
            countplanid:params.id,
            empty:selectedCategories,
            sector:sector,
            level:level
        }
   
        CountService.insertCountPlanLocations( (data) ).then((data) => {
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
               
                setDisplayConfirmation7(false);
                 setSector([]); 
                 setLevel([]);
                 setSelectedCategories([])
                loadLazyData();
            } 
            
            else{
                setDisplayConfirmation7(false);
                setSector([]); 
                setLevel([]);
                setSelectedCategories([])
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
            }
        });

    }

    const onSubmitItem = () => {
        // setLoading(true);
        // setbtnDisabled(true);
        const data ={
            countplanid:params.id,
          item:item,
          empty:selectedCategories,
        }
        CountService.insertCountPlanLocations( (data) ).then((data) => {
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
               
                setDisplayItemDialog(false)
                 setItem([])
                loadLazyData();
            } 
            
            else{
                setDisplayItemDialog(false); 
                setItem([])
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
            }
        });


    }
    const onSubmitSql = () => {
        // Guard clause for empty or undefined sqlQuery
       console.log("SQL Query:", sqlQuery);
    
        // Convert to lowercase for case-insensitive matching
    
        // Check for required clause
        if (!sqlQuery.includes("select loc_ID from")) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Invalid SQL Query',
                detail: 'Query must contain "select loc_ID from ...".',
                life: 4000
            });
            return;
        }
    
        // Proceed if valid
        const data = {
            countplanid: params.id,
            sql: sqlQuery,
            empty: selectedCategories,
        };
    
        console.log("Submitting data:", data);
        CountService.insertCountPlanLocations( (data) ).then((data) => {
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
               
                setDisplaySQLDialog(false)
                 setSqlQuery('')
                loadLazyData();
            } 
            
            else{
                setDisplaySQLDialog(false); 
                setSqlQuery('')
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
            }
        });
    };
    const confirmationDialogFooter7 = (
        <div>
            <Button label="Submit" disabled={btnDisabled} icon="pi pi-check" onClick={() => onSubmitLoc()} />
        </div>
    );
    const itemDialogFooter = (
        <div>

            <Button label="Submit" disabled={btnDisabled} icon="pi pi-check" onClick={() => onSubmitItem()} />
          
        </div>
    );

    const sqlDialogFooter = (
        <div>

            <Button label="Submit" disabled={btnDisabled} icon="pi pi-check" onClick={() => onSubmitSql()} />
           
        </div>
    );
  
    const actionItems = [
        {
            label: 'Location',
            icon: 'pi pi-map-marker',
            command: () => {
            setDisplayConfirmation7(true)
            setbtnDisabled(false)
            }
        },
        {
            label: 'Item',
            icon: 'pi pi-box',
            command: () => {
                setbtnDisabled(false)
                    setDisplayItemDialog(true);
               
            }
        },
        {
            label: 'SQL',
            icon: 'pi pi-database',
            command: () => {
                setbtnDisabled(false)
                    setDisplaySQLDialog(true);
              
            }
        }
      
    ];
    const categories = [
        { name: 'Empty Location', key: '1' }
    ];
    
    const [selectedCategories, setSelectedCategories] = useState([]); // initialize as empty array
    
    const onCategoryChange = (e) => {
        const value = e.value;
        const checked = e.checked;
    
        let _selectedCategories = [...selectedCategories];
    
        if (checked) {
            _selectedCategories.push(value);
        } else {
            _selectedCategories = _selectedCategories.filter(c => c.key !== value.key);
        }
    
        setSelectedCategories(_selectedCategories);
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" />
                <Button label="Actions" icon="pi pi-align-left" className="mr-2" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup />
            </span>
            <span className="flex align-items-center gap-2">
    
        </span>

        </div>
    );

    const fetchOptions = async (searchQuery, pageNumber) => {
        // Always reset loading at the beginning
        setLoading(true);
    
        // Create parameter object
        const param = {
            query: searchQuery,
            page: pageNumber,
        };
    
        try {
            const data = await CountService.getMantisProducts(param);
    
            if (data.error === 0) {
                const fetchedOptions = data.data.data;
                const lastPage = data.data.last_page;
    
                // If this is a new search (first page), replace results
                if (pageNumber === 1) {
                    setProduct(fetchedOptions);
                } else {
                    // If loading more pages, append to existing list
                    setProduct((prevOptions) => [...prevOptions, ...fetchedOptions]);
                }
    
                // If there are no more pages to load
                if (lastPage < 70 || fetchedOptions.length === 0) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }
            } else {
                toast.current.show({
                    severity: 'error',
                    summary: 'Error in Data creation',
                    detail: data.message,
                });
            }
        } catch (error) {
            console.error("Error fetching options:", error);
            toast.current.show({
                severity: 'error',
                summary: 'Network Error',
                detail: 'Could not fetch products.',
            });
        } finally {
            // Always end loading cleanly
            setLoading(false);
        }
    };

    const navigate = useNavigate();

    const handleSearchChange = (event) => {
        setLoading(true);
        const value = event.filter;
        setInputValue(value);
        fetchOptions(value,10)
        
      };
      useEffect(() => {
        fetchOptions(inputValue, 200);
      }, []);

      
      

    
    
    return (
        <>

 <Dialog header="Location" visible={displayConfirmation7} style={{ width: '50vw' }} onHide={() => { setDisplayConfirmation7(false); setSector([]); setLevel([]);  setSelectedCategories([])}} footer={confirmationDialogFooter7}>
            <div className="p-fluid formgrid grid">
            <div className="field col-12 md:col-9">
                <label>Location</label>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                        <MultiSelect
                                style={{ marginRight: 5, marginLeft: 10, width: '300px' }} 
                                value={sector} 
                                options={loc} 
                                onChange={(e) => setSector(e.value)}
                                filter
                            
                                placeholder="Select Sector"
                                maxSelectedLabels={3}
                            />

                            <MultiSelect
                                style={{ marginRight: 5, marginLeft: 10, width: '300px' }} 
                                value={level} 
                                options={side} // now array of { label, value }
                                onChange={(e) => setLevel(e.value)}
                            
                                filter
                                placeholder="Select Level"
                                maxSelectedLabels={3}
                            />
                        </div>
                        <div className="flex flex-column gap-3 mt-5 ml-4">
                                {categories.map((category) => (
                                    <div key={category.key} className="flex align-items-center">
                                        <Checkbox 
                                            inputId={category.key} 
                                            name="category" 
                                            value={category} 
                                            onChange={onCategoryChange} 
                                            checked={selectedCategories.some((item) => item.key === category.key)} 
                                        />
                                        <label htmlFor={category.key} className="ml-2">{category.name}</label>
                                    </div>
                                ))}
                            </div>
                    </div>
                    </div>

            </Dialog>

            <Dialog 
            header="Item" 
            visible={displayItemDialog} 
            style={{ width: '50vw' }} 
            onHide={() => {setDisplayItemDialog(false); setItem([])}} 
            footer={itemDialogFooter}
>
        <div className="p-fluid formgrid grid">
            <div className="field col-12 md:col-9">
                <label>Item*</label>
                               <Dropdown
                                            value={item}
                                            editable
                                            options={product}
                                            onChange={(e) => setItem(e.target.value)}
                                            onFilter={handleSearchChange} // Handles the search filter
                                            filter // Enable filter
                                            filterBy="prd_PrimaryCode" // Filter by 'name' field
                                            placeholder="Search and Select"
                                            emptyMessage={loading ? <><i className="pi pi-spin pi-spinner p-mr-2"></i> <span>Loading Item... </span> </>: 'No results found'}
                                            scrollHeight="300px" // Limit height to enable scrolling
                                            loading={loading}
                                           
                                            optionLabel="prd_PrimaryCode" // Display name as the option label
                                            optionValue="prd_ID" // Display name as the option label
                                             // Show loading spinner when fetching data
                                        />
            </div>
        </div>
    </Dialog>

            {/* SQL Dialog */}
                            <Dialog
                header="SQL Query"
                visible={displaySQLDialog}
                style={{ width: '50vw' }}
                onHide={() => {setDisplaySQLDialog(false);setSqlQuery('')}}
                footer={sqlDialogFooter}
                >

                            <div className="p-fluid formgrid grid">
                                <div className="field col-12">
                                    <label htmlFor="sql">Query*</label>
                                    <InputTextarea 
                                    id="sql"
                                    value={sqlQuery}
                                    onChange={(e) => {setSqlQuery(e.target.value);
                                        }
                                    } 
                                    rows={10}
                                    autoResize
                                    placeholder="Your SQL query will appear here..."
                                    style={{
                                        width: '100%',
                                        fontFamily: 'monospace',
                                        marginRight: 5,
                                        marginLeft: 10,
                                    }}
                                />
                                </div>
                            </div>
                        </Dialog>


             <Toast ref={toast} />
            {/* <BreadCrumb model={items} home={home} /> */}
          
            <Button
            label="Back"
            icon="pi pi-arrow-left"
            className="p-button-primary mt-0"
            onClick={() => navigate("/count/count-plan")} 
            style={{ margin: '10px 0' }}
        />

<div className="card">
                {/* <h3>Shipment</h3> */}
                <h1></h1>
                <div className="p-fluid formgrid grid">
                    <div className="field col-12 md:col-4">
                        <h5 id="created_at">Count Code</h5>
                        <p htmlFor="created_at">{params.code}</p>

                    </div>
                 
                    {/* <div className="field col-12 md:col-4">
                        <h5 id="status">Status</h5>
                        <Tag value={statusValue} severity={getStatusSeverity(pickListDetail.status)} />

                    </div> */}
                </div>
            </div> 
            <div className="card">
               
                <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                    <span className="block mt-2 md:mt-0 p-input-icon-left">
                        <h3>Count Location</h3>
                    </span>
                </div>
                <h1></h1>
                <DataTable
                    value={shipmentLines}
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
                    header={header}
                    sortField={lazyState.sortField}
                    className="datatable-responsive"
                    sortOrder={lazyState.sortOrder}
                    onFilter={onFilter}
                    filters={lazyState.filters}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                    loading={loading}
                    tableStyle={{ minWidth: '75rem' }}
                    emptyMessage="No shipments found."
                    selection={selectedShipments}
                    onSelectionChange={onSelectionChange}
                    selectAll={selectAll}
                    onSelectAllChange={onSelectAllChange}
                    scrollable
                    scrollHeight="600px"
                    removableSort
                >
                    {/* <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} /> */}

                    <Column field="loc_Code" header="Location Code" body={(rowData) => rowData.loc_Code} sortable filter showFilterMenu={false} filterPlaceholder="Search"  />
                    <Column field="StatusDescription"  header="Status" body={(rowData) => rowData.StatusDescription}  />
                    <Column field="clc_CountNumber"   header="Number of Count" body={(rowData) => rowData.clc_CountNumber}  />


                </DataTable>
            </div>
        </>

    );
}
