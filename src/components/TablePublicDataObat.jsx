import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';

export default function DataGridDemo({ rowsData }) {
  const rowsWithNomor = React.useMemo(
    () => rowsData.map((row, idx) => ({
      ...row,
      nomor: idx + 1,
      id: idx + 1, 
    })),
    [rowsData]
  );

  const columns = [
    {
      field: 'nieNumber',
      headerName: 'No. Izin Edar',
      width: 180,
      flex: 0,
      renderCell: (params) => (
        <a
          href={`http://localhost:3000/public/obat/${params.row.ipfsCid}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#1d61d6', textDecoration: 'underline' }}
        >
          {params.value}
        </a>
      ),
    },
    {
      field: 'namaProduk',
      headerName: 'Nama Produk',
      width: 260,
      flex: 0,
    },
    {
      field: 'approvedTimestamp',
      headerName: 'Tanggal Diterbitkan',
      width: 170,
      flex: 0,
      renderCell: (params) => {
        const raw = Number(params.value);
        if (!raw) return '-';
        const date = new Date(raw * 1000);
        return date.toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      },
    },
    { field: 'jenisIzin', headerName: 'Jenis Izin', width: 180 },
    {
      field: 'companyName',
      headerName: 'Perusahaan',
      width: 210,
      flex: 0,
    },
    {
      field: 'companyAddress',
      headerName: 'Alamat',
      width: 320,
      flex: 0,
      renderCell: (params) => (
        <div style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.4 }}>
          {params.value}
        </div>
      ),
    },
    {
      field: 'companyNib',
      headerName: 'NIB',
      width: 160,
      flex: 0,
    },
    {
      field: 'bpomInstance',
      headerName: 'BPOM',
      width: 150,
      flex: 0,
    },
    {
      field: 'approvedHash',
      headerName: 'Cek transaksi',
      width: 150,
      flex: 0,
      renderCell: (params) => (
        <a
          href={`https://sepolia.etherscan.io/tx/${params.value}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#1d61d6', textDecoration: 'underline' }}
        >
          Cek di Etherscan
        </a>
      ),
    },
  ];

  const paginationModel = { page: 0, pageSize: 10 };

  return (
    <Paper sx={{ width: '100%' }}>
      <Box sx={{ width: '100%'}}>
        <DataGrid
          rows={rowsWithNomor}
          columns={columns}
          initialState={{ pagination: { paginationModel } }}
          pageSizeOptions={[5, 10, 25, 50]}
          pagination
          disableRowSelectionOnClick
          sx={{
            width: '100%',
            fontFamily: 'Instrument Sans, sans-serif',
            fontSize: '13px',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f2f3f59e',
              fontWeight: 'bold',
              borderBottom: '1px solid #ddd',
              textTransform: 'none',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
            },
            '& .MuiDataGrid-cell': {
              whiteSpace: 'normal !important',
              wordBreak: 'break-word',
              lineHeight: '1.4',
              paddingTop: '8px',
              paddingBottom: '8px',
              borderBottom: '1px solid #f0f0f0',
            },
            '& .MuiDataGrid-row': {
              maxHeight: 'none !important',
            },
            '& .MuiDataGrid-row:nth-of-type(even)': {
              backgroundColor: '#f2f3f59e',
            },
            '& .MuiDataGrid-row:nth-of-type(odd)': {
              backgroundColor: '#ffffff',
            },
          }}    
        />
      </Box>
    </Paper>
  );
}
