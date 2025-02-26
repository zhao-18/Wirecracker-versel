//  internal function
//
//  - Jimmy Shen (jimmy@rotman-baycrest.on.ca)
//
//  This version is ported from original MatLab script into JavaScript by Wirecracker team and distributed under MIT license.

import FILE from "./FILE.js";

export default function load_untouch0_nii_hdr ( machine, data )
{
    const fid = new FILE('', machine);
    fid.fopen(data);

    fid.frewind();
    let hdr = load_untouch0_nii_hdr_read_header(fid, false);

    return hdr;
}

function load_untouch0_nii_hdr_read_header ( fid ) {
    let dsr = {};

    dsr.hk   = load_untouch0_nii_hdr_header_key(fid);
    dsr.dime = load_untouch0_nii_hdr_image_dimension(fid);
    dsr.hist = load_untouch0_nii_hdr_data_history(fid);

    return dsr;
}

function load_untouch0_nii_hdr_header_key ( fid ) {
    fid.frewind();

    //  Original header structures
    //  struct header_key                     /* header key      */
    //       {                                /* off + size      */
    //       int sizeof_hdr                   /*  0 +  4         */
    //       char data_type[10];              /*  4 + 10         */
    //       char db_name[18];                /* 14 + 18         */
    //       int extents;                     /* 32 +  4         */
    //       short int session_error;         /* 36 +  2         */
    //       char regular;                    /* 38 +  1         */
    //       char hkey_un0;                   /* 39 +  1         */
    //       };                               /* total=40 bytes  */
    //
    // int sizeof_header   Should be 348.
    // char regular        Must be 'r' to indicate that all images and
    //                     volumes are the same size.

    const hk = {};

    hk.sizeof_hdr    = fid.fread( 1,  'int32');   // should be 348!
    hk.data_type     = fid.fread(10, 'string');
    hk.db_name       = fid.fread(18, 'string');
    hk.extents       = fid.fread( 1,  'int32');
    hk.session_error = fid.fread( 1,  'int16');
    hk.regular       = fid.fread( 1, 'string');
    hk.hkey_un0      = fid.fread( 1,  'uchar');

    return hk;
}

function load_untouch0_nii_hdr_image_dimension ( fid ) {

    //  struct image_dimension
    //       {                                /* off + size      */
    //       short int dim[8];                /* 0 + 16          */
    //       /*
    //           dim[0]      Number of dimensions in database; usually 4.
    //           dim[1]      Image X dimension;  number of *pixels* in an image row.
    //           dim[2]      Image Y dimension;  number of *pixel rows* in slice.
    //           dim[3]      Volume Z dimension; number of *slices* in a volume.
    //           dim[4]      Time points; number of volumes in database
    //       */
    //       char vox_units[4];               /* 16 + 4          */
    //       char cal_units[8];               /* 20 + 8          */
    //       short int unused1;               /* 28 + 2          */
    //       short int datatype;              /* 30 + 2          */
    //       short int bitpix;                /* 32 + 2          */
    //       short int dim_un0;               /* 34 + 2          */
    //       float pixdim[8];                 /* 36 + 32         */
    //       /*
    //           pixdim[] specifies the voxel dimensions:
    //           pixdim[1] - voxel width, mm
    //           pixdim[2] - voxel height, mm
    //           pixdim[3] - slice thickness, mm
    //           pixdim[4] - volume timing, in msec
    //                       ..etc
    //       */
    //       float vox_offset;                /* 68 + 4          */
    //       float roi_scale;                 /* 72 + 4          */
    //       float funused1;                  /* 76 + 4          */
    //       float funused2;                  /* 80 + 4          */
    //       float cal_max;                   /* 84 + 4          */
    //       float cal_min;                   /* 88 + 4          */
    //       int compressed;                  /* 92 + 4          */
    //       int verified;                    /* 96 + 4          */
    //       int glmax;                       /* 100 + 4         */
    //       int glmin;                       /* 104 + 4         */
    //       };                               /* total=108 bytes */

    const dime = {};

    dime.dim        = fid.fread(8,   'int16');
    dime.vox_units  = fid.fread(4,  'string');
    dime.cal_units  = fid.fread(8,  'string');
    dime.unused1    = fid.fread(1,   'int16');
    dime.datatype   = fid.fread(1,   'int16');
    dime.bitpix     = fid.fread(1,   'int16');
    dime.dim_un0    = fid.fread(1,   'int16');
    dime.pixdim     = fid.fread(8, 'float32');
    dime.vox_offset = fid.fread(1, 'float32');
    dime.roi_scale  = fid.fread(1, 'float32');
    dime.funused1   = fid.fread(1, 'float32');
    dime.funused2   = fid.fread(1, 'float32');
    dime.cal_max    = fid.fread(1, 'float32');
    dime.cal_min    = fid.fread(1, 'float32');
    dime.compressed = fid.fread(1,   'int32');
    dime.verified   = fid.fread(1,   'int32');
    dime.glmax      = fid.fread(1,   'int32');
    dime.glmin      = fid.fread(1,   'int32');

    return dime;
}

function load_untouch0_nii_hdr_data_history ( fid ) {

    // struct data_history
    //        {                                /* off + size      */
    //        char descrip[80];                /* 0 + 80          */
    //        char aux_file[24];               /* 80 + 24         */
    //        char orient;                     /* 104 + 1         */
    //        char originator[10];             /* 105 + 10        */
    //        char generated[10];              /* 115 + 10        */
    //        char scannum[10];                /* 125 + 10        */
    //        char patient_id[10];             /* 135 + 10        */
    //        char exp_date[10];               /* 145 + 10        */
    //        char exp_time[10];               /* 155 + 10        */
    //        char hist_un0[3];                /* 165 + 3         */
    //        int views                        /* 168 + 4         */
    //        int vols_added;                  /* 172 + 4         */
    //        int start_field;                 /* 176 + 4         */
    //        int field_skip;                  /* 180 + 4         */
    //        int omax;                        /* 184 + 4         */
    //        int omin;                        /* 188 + 4         */
    //        int smax;                        /* 192 + 4         */
    //        int smin;                        /* 196 + 4         */
    //        };                               /* total=200 bytes */

    const hist = {};

    hist.descrip     = fid.fread(80, 'string');
    hist.aux_file    = fid.fread(24, 'string');
    hist.orient      = fid.fread( 1,   'char');
    hist.originator  = fid.fread( 5,  'int16');
    hist.generated   = fid.fread(10, 'string');
    hist.scannum     = fid.fread(10, 'string');
    hist.patient_id  = fid.fread(10, 'string');
    hist.exp_date    = fid.fread(10, 'string');
    hist.exp_time    = fid.fread(10, 'string');
    hist.hist_un0    = fid.fread( 3, 'string');
    hist.views       = fid.fread( 1,  'int32');
    hist.vols_added  = fid.fread( 1,  'int32');
    hist.start_field = fid.fread( 1,  'int32');
    hist.field_skip  = fid.fread( 1,  'int32');
    hist.omax        = fid.fread( 1,  'int32');
    hist.omin        = fid.fread( 1,  'int32');
    hist.smax        = fid.fread( 1,  'int32');
    hist.smin        = fid.fread( 1,  'int32');

    return hist;
}
