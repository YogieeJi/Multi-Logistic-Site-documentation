import React, { useState, useEffect, useRef} from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardService } from '../../service/DashboardService';
import '../../assets/taskdashboard.css';
import { useParams } from 'react-router-dom';
export default function TasksReport() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [tasks, setTasks] = useState(null);
    const [selectedTasks, setSelectedTasks] = useState(null);
    const toast = useRef(null);
    const [dateFrom, setDateFrom] = useState(null);
    const [minTotalDuration, setMinTotalDuration] = useState(null);
    const [minBreakTime, setMinBreakTime] = useState(null);
    const dateRef = useRef(null); 
    const [lazyState, setLazyState] = useState({
        first: 0,
        rows: 25,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {
            TotalDuration: { value: null, matchMode: 'gte' },
            BreakTime: { value: null, matchMode: 'gte' }
        }
    });

    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    // Initialize date from URL params if available
    useEffect(() => {
        const dateParam = params.date;
        
        if (dateParam) {
            setDateFrom(new Date(dateParam));
        }
    }, [location.search]);

    // Load data whenever lazyState or filters change
    useEffect(() => {
        loadData();
    }, [lazyState]);

    const loadData = async () => {
        setLoading(true);
        try {
            const formattedDate = dateFrom ? new Date(dateFrom).toLocaleDateString('en-CA') : params.date;
            
            const requestData = {
                lazyState: {
                    ...lazyState,
                    filters: {
                        TotalDuration: { value: minTotalDuration, matchMode: 'gte' },
                        BreakTime: { value: minBreakTime, matchMode: 'gte' }
                    }
                },
                dateFrom: formattedDate
            };

            const response = await DashboardService.getTaskReport(requestData);
            setTasks(null)
            setTasks(response.data);
            setTotalRecords(response.totalRecords);
        } catch (error) {
            toast.current.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'Failed to load tasks',
                life: 3000 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateClick = () => {
        // Reset to first page when generating new results
        setLazyState(prev => ({
            ...prev,
            first: 0,
            page: 0,
            filters: {
                TotalDuration: { value: minTotalDuration, matchMode: 'gte' },
                BreakTime: { value: minBreakTime, matchMode: 'gte' }
            }
        }));
    };

    const refreshData = () => {
       loadData()
    };
    const  downloadPDF = async () => {
        setLoading(true);
        try {
            const formattedDate = dateFrom ? new Date(dateFrom).toLocaleDateString('en-CA') : null;
            
            const requestData = {
                lazyState: {
                    first: lazyState.first,
                    rows: lazyState.rows,
                    page: lazyState.page,
                    sortField: lazyState.sortField || null,
                    sortOrder: lazyState.sortOrder || null,
                    filters: {
                        TotalDuration: { value: minTotalDuration, matchMode: 'gte' },
                        BreakTime: { value: minBreakTime, matchMode: 'gte' }
                    }
                },
                dateFrom: formattedDate,
                pdf: true
            };
    
            const response = await DashboardService.getTaskPDFReport(requestData);
            
            if (!response.blob) {
                throw new Error("No PDF blob received");
            }
    
            const url = window.URL.createObjectURL(response.blob);
            const now = new Date();
            const formattedNow = now.toISOString().split('T')[0];
            const identifier = response.receiptCode || params.id;
            const filename = `User_Report${identifier ? `_${identifier}` : ''}_${formattedNow}.pdf`;
    
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 100);
        } catch (error) {
            console.error("Error downloading PDF:", error);
            toast.current?.show({
                severity: 'error',
                summary: 'Download Error',
                detail: error.message || 'Failed to download the report PDF.',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };
    

    const clearAllFilters = () => {
        setMinTotalDuration(null);
        setMinBreakTime(null);
        setDateFrom(null);
        setLazyState(prev => ({
            ...prev,
            first: 0,
            page: 0,
            filters: {
                TotalDuration: { value: null, matchMode: 'gte' },
                BreakTime: { value: null, matchMode: 'gte' }
            }
        }));
    };

    const onPage = (event) => {
        setLazyState(event);
    };

    const onSort = (event) => {
        setLazyState(event);
    };

    const onFilter = (event) => {
        event['first'] = 0;
        setLazyState(event);
    };

    const header = (
        
        <div className="flex flex-wrap align-items-center justify-content-between gap-4">
             
            <div className="flex align-items-center gap-3">
                <span className="p-float-label">
                    <Calendar 
                        ref={dateRef}
                        id="dateFrom"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.value)} 
                        showIcon
                        showOnFocus={false} 
                        inputRef={(el) => {
                            if (el) {
                                el.onmousedown = (e) => {
                                    e.preventDefault();           
                                    dateRef.current.show(); 
                                };
                            }
                        }} 
                        dateFormat="yy-mm-dd"
                    />
                    <label htmlFor="dateFrom">Date</label>
                </span>

                <div className="p-field"  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label htmlFor="totalDurationMin" className="p-d-block" style={{ minWidth: '100px' }}>Duration (min)</label>
                    <InputNumber 
                        id="totalDurationMin"
                        value={minTotalDuration}
                        onChange={(e) => setMinTotalDuration(e.value)}
                        placeholder="Min"
                        mode="decimal"
                        min={0}
                        showButtons
                        className="p-inputtext-sm"
                    />
                </div>

                <div className="p-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label htmlFor="breakTimeMin" className="p-d-block" style={{ minWidth: '100px' }}>Break (min)</label>
                    <InputNumber 
                        id="breakTimeMin"
                        value={minBreakTime}
                        onChange={(e) => setMinBreakTime(e.value)}
                        placeholder="Min"
                        mode="decimal"
                        min={0}
                        showButtons
                        className="p-inputtext-sm"
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Button 
                    label="Clear All" 
                    onClick={clearAllFilters} 
                    severity="danger" 
                    icon="pi pi-filter-slash" 
                  
                    className="ml-4"
                />
                <Button 
                    label="Generate" 
                    onClick={handleGenerateClick} 
                    severity="primary" 
                    className="ml-4"
                    loading={loading}
                />
            </div>
           
            </div>
            <div className="flex align-items-center gap-2">
                <Button 
                    label="Refresh" 
                    loading={loading} 
                    onClick={refreshData} 
                    severity="success" 
                    icon="pi pi-refresh" 
                    size="small" 
                />
            </div>
        </div>
    );

    return (
        <div className="card">
            <Toast ref={toast} />
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <Button
                    label="Back"
                    icon="pi pi-arrow-left"
                    className="p-button-primary"
                    onClick={() => navigate("/user-task-dashboard")}
                />

                <Button
                    label="Download PDF"
                    icon="pi pi-file-pdf"
                    onClick={downloadPDF}
                    severity="danger"
                    className="p-button-danger"
                />
            </div>



            <h3 className="mt-0 mb-3">User Task Report</h3>
            
            <DataTable 
                value={tasks} 
                lazy 
                filterDisplay="row" 
                dataKey="log_id" 
                showGridlines
                first={lazyState.first} 
                paginator
                rows={lazyState.rows} 
                totalRecords={totalRecords} 
                onPage={onPage}
                onSort={onSort} 
                onFilter={onFilter}
                size="small"
                sortField={lazyState.sortField}    
                sortOrder={lazyState.sortOrder}
                filters={lazyState.filters} 
                rowsPerPageOptions={[25, 50, 100, 500, 1000]}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                loading={loading} 
                tableStyle={{ minWidth: '75rem' }}
                emptyMessage="No tasks found."
                selection={selectedTasks} 
                onSelectionChange={(e) => setSelectedTasks(e.value)}
                scrollable 
                header={header}
                scrollHeight="600px"
                removableSort
            >
                <Column field="names" header="User Name" filterMenuStyle={{ width: '14rem' }} sortable />
                <Column field="tsk_Code" header="Task Code" filterMenuStyle={{ width: '14rem' }} sortable />
                <Column field="trt_MessageCode" header="Task Type" filterMenuStyle={{ width: '14rem' }} sortable />
                <Column field="prd_PrimaryCode" sortable header="Item" />
                <Column field="tsk_FromLocationCode" sortable header="From Location" />
                <Column field="tsk_ToLocationCode" sortable header="To Location" />
                <Column field="startTime" sortable header="Start Time" />
                <Column 
                    field="totalDuration" 
                  
                    header="Total Duration" 
                   
                    filterField="TotalDuration" 
                    filterElement={<InputNumber />}
                />
                <Column field="finishTime" header="Finish Time" filterMenuStyle={{ width: '14rem' }} sortable />
                <Column 
                    field="breakTime" 
                   
                    header="Break Time" 
                   
                    filterField="BreakTime" 
                    filterElement={<InputNumber />}
                />
                <Column field="nextTaskCode" sortable header="Next Task Code" />
            </DataTable>
        </div>
    );
}