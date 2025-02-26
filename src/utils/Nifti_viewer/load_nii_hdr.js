//  internal function
//
//  - Jimmy Shen (jimmy@rotman-baycrest.on.ca)
//
//  This version is ported from original MatLab script into JavaScript by Wirecracker team and distributed under MIT license.

import FILE from "./FILE.js";

export default function load_nii_hdr ( filename, data ) {
    if ( !filename ) {
        throw 'Usage: [hdr, filetype, fileprefix, machine] = load_nii_hdr(filename)';
    }

    let machine = 'ieee-le';
    let fileprefix;

    if ( filename.substr( filename.length - 4 ) === '.nii' ) {
        fileprefix = filename.slice(0, -4);
    } else if ( filename.substr( filename.length - 4 ) === '.hdr' ) {
        fileprefix = filename.slice(0, -4);
    } else if ( filename.substr( filename.length - 4 ) === '.img' ) {
        fileprefix = filename.slice(0, -4);
    } else {
        throw 'Supported extension type : .nii .hdr .img';
    }


    const fid = new FILE('', machine);
    fid.fopen(data);
    fid.frewind();

    let hdr;
    if ( fid.fread(1, 'int32') === 348 ) {
        hdr = read_header(fid);
    } else {
        // If magic number is different, try reading the opposite endian
        machine = 'ieee-be';
        fid.littleEndian = false;

        fid.frewind();
        if ( fid.fread(1, 'int32') !== 348 ) {
            throw 'File ${filename} is corrupted.'
        }
        hdr = read_header(fid);
    }

    let filetype = 0;
    if ( hdr.hist.magic === 'n+1' ) {
        filetype = 2;
    } else if ( hdr.hist.magic === 'ni1' ) {
        filetype = 1;
    }

    fid.fclose();
    return [hdr, filetype, fileprefix, machine]
}

function read_header ( fid ) {
    let dsr = {};

    dsr.hk   = header_key(fid);
    dsr.dime = image_dimension(fid);
    dsr.hist = data_history(fid);

    if ( !dsr.hist.magic === 'n+1' && !dsr.hist.magic === 'ni1' ) {
        dsr.hist.qform_code = 0;
        dsr.hist.sform_code = 0;
    }

    return dsr;
}

function header_key ( fid ) {
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
    //       char dim_info;   % char hkey_un0;        /* 39 +  1 */
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
    hk.dim_info      = fid.fread( 1,  'uchar');

    return hk;
}

function image_dimension ( fid ) {
    //  Original header structures
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
    //       float intent_p1;   % char vox_units[4];   /* 16 + 4       */
    //       float intent_p2;   % char cal_units[8];   /* 20 + 4       */
    //       float intent_p3;   % char cal_units[8];   /* 24 + 4       */
    //       short int intent_code;   % short int unused1;   /* 28 + 2 */
    //       short int datatype;              /* 30 + 2          */
    //       short int bitpix;                /* 32 + 2          */
    //       short int slice_start;   % short int dim_un0;   /* 34 + 2 */
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
    //       float scl_slope;   % float roi_scale;     /* 72 + 4 */
    //       float scl_inter;   % float funused1;      /* 76 + 4 */
    //       short slice_end;   % float funused2;      /* 80 + 2 */
    //       char slice_code;   % float funused2;      /* 82 + 1 */
    //       char xyzt_units;   % float funused2;      /* 83 + 1 */
    //       float cal_max;                   /* 84 + 4          */
    //       float cal_min;                   /* 88 + 4          */
    //       float slice_duration;   % int compressed; /* 92 + 4 */
    //       float toffset;   % int verified;          /* 96 + 4 */
    //       int glmax;                       /* 100 + 4         */
    //       int glmin;                       /* 104 + 4         */
    //       };                               /* total=108 bytes */

    const dime = {};

    dime.dim            = fid.fread(8,   'int16');
    dime.intent_p1      = fid.fread(1, 'float32');
    dime.intent_p2      = fid.fread(1, 'float32');
    dime.intent_p3      = fid.fread(1, 'float32');
    dime.intent_code    = fid.fread(1,   'int16');
    dime.datatype       = fid.fread(1,   'int16');
    dime.bitpix         = fid.fread(1,   'int16');
    dime.slice_start    = fid.fread(1,   'int16');
    dime.pixdim         = fid.fread(8, 'float32');
    dime.vox_offset     = fid.fread(1, 'float32');
    dime.scl_slope      = fid.fread(1, 'float32');
    dime.scl_inter      = fid.fread(1, 'float32');
    dime.slice_end      = fid.fread(1,   'int16');
    dime.slice_code     = fid.fread(1,   'uchar');
    dime.xyzt_units     = fid.fread(1,   'uchar');
    dime.cal_max        = fid.fread(1, 'float32');
    dime.cal_min        = fid.fread(1, 'float32');
    dime.slice_duration = fid.fread(1, 'float32');
    dime.toffset        = fid.fread(1, 'float32');
    dime.glmax          = fid.fread(1,   'int32');
    dime.glmin          = fid.fread(1,   'int32');

    return dime;
}

function data_history ( fid ) {
    //  Original header structures
    //  struct data_history
    //       {                                /* off + size      */
    //       char descrip[80];                /* 0 + 80          */
    //       char aux_file[24];               /* 80 + 24         */
    //       short int qform_code;            /* 104 + 2         */
    //       short int sform_code;            /* 106 + 2         */
    //       float quatern_b;                 /* 108 + 4         */
    //       float quatern_c;                 /* 112 + 4         */
    //       float quatern_d;                 /* 116 + 4         */
    //       float qoffset_x;                 /* 120 + 4         */
    //       float qoffset_y;                 /* 124 + 4         */
    //       float qoffset_z;                 /* 128 + 4         */
    //       float srow_x[4];                 /* 132 + 16        */
    //       float srow_y[4];                 /* 148 + 16        */
    //       float srow_z[4];                 /* 164 + 16        */
    //       char intent_name[16];            /* 180 + 16        */
    //       char magic[4];   % int smin;     /* 196 + 4         */
    //       };                               /* total=200 bytes */

    const hist = {};

    hist.descrip     = fid.fread(80,  'string');
    hist.aux_file    = fid.fread(24,  'string');
    hist.qform_code  = fid.fread( 1,   'int16');
    hist.sform_code  = fid.fread( 1,   'int16');
    hist.quatern_b   = fid.fread( 1, 'float32');
    hist.quatern_c   = fid.fread( 1, 'float32');
    hist.quatern_d   = fid.fread( 1, 'float32');
    hist.qoffset_x   = fid.fread( 1, 'float32');
    hist.qoffset_y   = fid.fread( 1, 'float32');
    hist.qoffset_z   = fid.fread( 1, 'float32');
    hist.srow_x      = fid.fread( 4, 'float32');
    hist.srow_y      = fid.fread( 4, 'float32');
    hist.srow_z      = fid.fread( 4, 'float32');
    hist.intent_name = fid.fread(16,  'string');
    hist.magic       = fid.fread( 4,  'string');

    fid.fseek(253, 'bof');
    hist.originator = fid.fread(5, 'int16');

    return hist;
}
