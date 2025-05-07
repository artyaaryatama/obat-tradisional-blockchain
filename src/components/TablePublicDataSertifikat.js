import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { DataGrid } from '@mui/x-data-grid';

export default function DataGridDemo({ rowsData }) {
  const rowsWithNomor = rowsData.map((row, index) => ({
    ...row,
    nomor: index + 1,
  }));

  const columns = [
    // {
    //   field: 'fixedNumber',
    //   headerName: 'No.',
    //   width: 70,
    //   sortable: false,
    //   flex: 0,
    //   renderCell: (params) => {
    //     const sortedIds = params.api.getSortedRowIds();
    //     const index = sortedIds.indexOf(params.id);
    //     return index + 1;
    //   },
    // },
    {
      field: 'certNumber',
      headerName: 'No. Sertifikat',
      width: 230,
      flex: 0,
      renderCell: (params) => (
        <a
          href={`http://localhost:3000/public/certificate/${params.row.ipfsCid}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#1d61d6', textDecoration: 'underline' }}
        >
          {params.value}
        </a>
      ),
    },
    {
      field: 'jenisSertifikasi',
      headerName: 'Jenis Sertifikasi',
      width: 210,
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
        return date.toLocaleDateString("id-ID", {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
      
      
    },
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
        <div
          style={{
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            lineHeight: '1.4',
            width: '100%',
            
          }}
        >
          {params.value}
        </div>
      ),
    },
    {
      field: 'tipePermohonan',
      headerName: 'Tipe Permohonan',
      width: 160,
      flex: 0,
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
  console.log(columns);

  return (
    <Paper elevation={0} sx={{ border: '1px solid #f2f3f5', borderRadius: 2, p: 2 }}>
      <Box sx={{ minHeight: 480, width: '100%', overflowX: 'auto' }}>
        <DataGrid
          rows={rowsWithNomor}
          columns={columns}
          getRowId={(row) => `${row.nomor}-${row.noSertifikat}`}
          getRowHeight={() => 'auto'}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          disableRowSelectionOnClick
          sx={{
            minWidth: '1200px',
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

