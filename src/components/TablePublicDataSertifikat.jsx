import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';

export default function CertificateTable({ rowsData }) {
  const columns = [
    {
      field: 'certNumber',
      headerName: 'No. Sertifikat',
      width: 230,
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
    { field: 'jenisSertifikasi', headerName: 'Jenis Sertifikasi', width: 180 },
    {
      field: 'approvedTimestamp',
      headerName: 'Tanggal Diterbitkan',
      width: 160,
      renderCell: (params) => {
        const raw = Number(params.value);
        if (!raw) return '-';
        return new Date(raw * 1000).toLocaleDateString('id-ID', {
          year: 'numeric', month: 'long', day: 'numeric',
        });
      },
    },
    { field: 'companyName', headerName: 'Perusahaan', width: 200 },
    {
      field: 'companyAddress',
      headerName: 'Alamat',
      width: 300,
      renderCell: (params) => (
        <div style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.4 }}>
          {params.value}
        </div>
      ),
    },
    { field: 'tipePermohonan', headerName: 'Tipe Permohonan', width: 150 },
    { field: 'companyNib', headerName: 'NIB', width: 150 },
    { field: 'bpomInstance', headerName: 'BPOM', width: 150 },
    {
      field: 'approvedHash',
      headerName: 'Cek Transaksi',
      width: 150,
      renderCell: (params) => (
        <a
          href={`https://sepolia.etherscan.io/tx/${params.value}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#1d61d6', textDecoration: 'underline' }}
        >
          Etherscan
        </a>
      ),
    },
  ];

  const rows = rowsData.map((row, idx) => ({
    id: idx + 1,
    nomor: idx + 1,
    certNumber: row.certNumber,
    jenisSertifikasi: row.jenisSertifikasi,
    approvedTimestamp: row.approvedTimestamp || 0,
    companyName: row.companyName,
    companyAddress: row.companyAddress,
    tipePermohonan: row.tipePermohonan,
    companyNib: row.companyNib,
    bpomInstance: row.bpomInstance,
    approvedHash: row.approvedHash,
    ipfsCid: row.ipfsCid,
  }));

  const paginationModel = { page: 0, pageSize: 10 };

  return (
    <Paper sx={{ width: '100%' }}>
      <Box sx={{ width: '100%' }}>
        <DataGrid
          autoHeight
          rows={rows}
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
