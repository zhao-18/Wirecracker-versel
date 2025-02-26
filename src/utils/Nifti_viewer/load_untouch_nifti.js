//   _    _ _                              _
//  | |  | (_)                            | |
//  | |  | |_ _ __ ___  ___ _ __ __ _  ___| | _____ _ __
//  | |/\| | | '__/ _ \/ __| '__/ _` |/ __| |/ / _ \ '__|
//  \  /\  / | | |  __/ (__| | | (_| | (__|   <  __/ |
//   \/  \/|_|_|  \___|\___|_|  \__,_|\___|_|\_\___|_|
//
//
//  Load NIFTI or ANALYZE dataset, but not applying any appropriate affine
//  geometric transform or voxel intensity scaling.
//
//  Although according to NIFTI website, all those header information are
//  supposed to be applied to the loaded NIFTI image, there are some
//  situations that people do want to leave the original NIFTI header and
//  data untouched. They will probably just use MATLAB to do certain image
//  processing regardless of image orientation, and to save data back with
//  the same NIfTI header.
//
//  Since this program is only served for those situations, please use it
//  together with "save_untouch_nii.m", and do not use "save_nii.m" or
//  "view_nii.m" for the data that is loaded by "load_untouch_nii.m". For
//  normal situation, you should use "load_nii.m" instead.
//
//  Usage: nii = load_untouch_nii(filename, data, [img_idx], [dim5_idx], [dim6_idx], ...
//			[dim7_idx], [old_RGB], [slice_idx])
//
//  @param {string} filename  - 	NIFTI or ANALYZE file name.
//
//  @param {ArrayBuffer} data  - 	Raw content of the file.
//
//  @param {number[]} [img_idx]  -  a numerical array of image volume indices.
//	Only the specified volumes will be loaded. All available image
//	volumes will be loaded, if it is default or empty.
//
//	The number of images scans can be obtained from get_nii_frame.m,
//	or simply: hdr.dime.dim(5).
//
//  @param {number[]} [dim5_idx]  -  a numerical array of 5th dimension indices.
//	Only the specified range will be loaded. All available range
//	will be loaded, if it is default or empty.
//
//  @param {number[]} [dim6_idx]  -  a numerical array of 6th dimension indices.
//	Only the specified range will be loaded. All available range
//	will be loaded, if it is default or empty.
//
//  @param {number[]} [dim7_idx]  -  a numerical array of 7th dimension indices.
//	Only the specified range will be loaded. All available range
//	will be loaded, if it is default or empty.
//
//  @param {boolean|number} [old_RGB]  -  a scale number to tell difference of new RGB24
//	from old RGB24. New RGB24 uses RGB triple sequentially for each
//	voxel, like [R1 G1 B1 R2 G2 B2 ...]. Analyze 6.0 from AnalyzeDirect
//	uses old RGB24, in a way like [R1 R2 ... G1 G2 ... B1 B2 ...] for
//	each slices. If the image that you view is garbled, try to set
//	old_RGB variable to 1 and try again, because it could be in
//	old RGB24. It will be set to 0, if it is default or empty.
//
//  @param {number[]} [slice_idx]  -  a numerical array of image slice indices.
//	Only the specified slices will be loaded. All available image
//	slices will be loaded, if it is default or empty.
//
//  @returns {nii}  a object containing NIFTI header and data
//
//  nii structure:
//
//	hdr -		struct with NIFTI header fields.
//
//	filetype -	Analyze format .hdr/.img (0);
//			NIFTI .hdr/.img (1);
//			NIFTI .nii (2)
//
//	fileprefix - 	NIFTI filename without extension.
//
//	machine - 	machine string variable.
//
//	img - 		3D (or 4D) matrix of NIFTI data.
//
//  - Jimmy Shen (jimmy@rotman-baycrest.on.ca)
//
//  This version is ported from original MatLab script into JavaScript by Wirecracker team and distributed under MIT license.

import { isnumeric, unique, sub2ind, reshape, isequal, permute, prod } from './matlab_functions.js'
import FILE from './FILE.js'
import load_nii_ext from './load_nii_ext.js';
import load_nii_hdr from './load_nii_hdr.js';
import load_untouch_nii_hdr from './load_untouch_nii_hdr.js';
import load_untouch0_nii_hdr from './load_untouch0_nii_hdr.js';


export default function load_untouch_nii( filename, data, img_idx = [], dim5_idx = [], dim6_idx = [],
                                         dim7_idx = [], old_RGB = 0, slice_idx = [] )
{
    if ( !filename )
    {
        throw 'Usage: nii = load_untouch_nii(filename, [img_idx], [dim5_idx], [dim6_idx], [dim7_idx], [old_RGB], [slice_idx])'
    }

    let nii = {};
    [nii.hdr,nii.filetype,nii.fileprefix,nii.machine] = load_nii_hdr(filename, data);

    if (nii.filetype == 0)
    {
        nii.hdr = load_untouch0_nii_hdr(nii.machine, data);
        nii.ext = [];
    }
    else
    {
        nii.hdr = load_untouch_nii_hdr(nii.machine,data);
        //  Read the header extension
        nii.ext = load_nii_ext(filename,data);
    }

    //  Read the dataset body
    [nii.img,nii.hdr] = load_untouch_nii_img(nii.hdr, nii.filetype, nii.fileprefix, nii.machine, data,
                                                           img_idx, dim5_idx, dim6_idx, dim7_idx, old_RGB, slice_idx);

    nii.untouch = 1;

    return nii;
}

function load_untouch_nii_img ( hdr, filetype, fileprefix, machine, data,
                                              img_idx = [], dim5_idx = [], dim6_idx = [],
                                              dim7_idx = [], old_RGB = 0, slice_idx = [] )
{
    if ( !hdr || !filetype || !fileprefix || !machine || !data )
    {
        throw 'Usage: [img,hdr] = load_untouch_nii_img(hdr, filetype, fileprefix, machine, data [img_idx], [dim5_idx], [dim6_idx], [dim7_idx], [old_RGB], [slice_idx]);';
    }

    check_argin(img_idx, hdr);
    check_argin(dim5_idx, hdr);
    check_argin(dim6_idx, hdr);
    check_argin(dim7_idx, hdr);
    check_argin(slice_idx, hdr);

    return read_image(hdr, filetype, machine, img_idx, dim5_idx, dim6_idx, dim7_idx, old_RGB, slice_idx, data);
}

function check_argin ( input, hdr )
{
    let name = Object.keys({input})[0]
    if ( input.length != 0 && !isnumeric(input) )
    {
        throw `"${name}" should be a numerical array.`;
    }

    if ( unique(input).length != input.length )
    {
        throw `Duplicate image index in "${name}"`;
    }

    let max_range;
    if ( input.length != 0 && ( Math.min(...input) < 1 || Math.max(...input) > hdr.dime.dim[4] ) )
    {
        max_range = hdr.dime.dim[4];

        if ( max_range == 1 )
        {
            throw `"${name}" should be 1.`;
        }
        else
        {
            throw `"${name}" should be an integer within the range of [1 ~ ${max_range}].`;
        }
    }
}

function read_image ( hdr, filetype, machine,
                      img_idx, dim5_idx, dim6_idx,
                      dim7_idx, old_RGB, slice_idx, data )
{
    let img;

    const fid = new FILE('', machine);
    fid.fopen(data);

    //  Set bitpix according to datatype
    //
    //  /*Acceptable values for datatype are*/
    //
    //     0 None                     (Unknown bit per voxel) % DT_NONE, DT_UNKNOWN
    //     1 Binary                         (ubit1, bitpix=1) % DT_BINARY
    //     2 Unsigned char         (uchar or uint8, bitpix=8) % DT_UINT8, NIFTI_TYPE_UINT8
    //     4 Signed short                  (int16, bitpix=16) % DT_INT16, NIFTI_TYPE_INT16
    //     8 Signed integer                (int32, bitpix=32) % DT_INT32, NIFTI_TYPE_INT32
    //    16 Floating point    (single or float32, bitpix=32) % DT_FLOAT32, NIFTI_TYPE_FLOAT32
    //    32 Complex, 2 float32      (Use float32, bitpix=64) % DT_COMPLEX64, NIFTI_TYPE_COMPLEX64
    //    64 Double precision  (double or float64, bitpix=64) % DT_FLOAT64, NIFTI_TYPE_FLOAT64
    //   128 uint8 RGB                 (Use uint8, bitpix=24) % DT_RGB24, NIFTI_TYPE_RGB24
    //   256 Signed char            (schar or int8, bitpix=8) % DT_INT8, NIFTI_TYPE_INT8
    //   511 Single RGB              (Use float32, bitpix=96) % DT_RGB96, NIFTI_TYPE_RGB96
    //   512 Unsigned short               (uint16, bitpix=16) % DT_UNINT16, NIFTI_TYPE_UNINT16
    //   768 Unsigned integer             (uint32, bitpix=32) % DT_UNINT32, NIFTI_TYPE_UNINT32
    //  1024 Signed long long              (int64, bitpix=64) % DT_INT64, NIFTI_TYPE_INT64
    //  1280 Unsigned long long           (uint64, bitpix=64) % DT_UINT64, NIFTI_TYPE_UINT64
    //  1536 Long double, float128  (Unsupported, bitpix=128) % DT_FLOAT128, NIFTI_TYPE_FLOAT128
    //  1792 Complex128, 2 float64  (Use float64, bitpix=128) % DT_COMPLEX128, NIFTI_TYPE_COMPLEX128
    //  2048 Complex256, 2 float128 (Unsupported, bitpix=256) % DT_COMPLEX128, NIFTI_TYPE_COMPLEX128
    let precision;
    switch ( hdr.dime.datatype ) {
        case    2:
            hdr.dime.bitpix = 8;  precision = 'uint8';
            break;
        case    4:
            hdr.dime.bitpix = 16; precision = 'int16';
            break;
        case    8:
            hdr.dime.bitpix = 32; precision = 'int32';
            break;
        case   16:
            hdr.dime.bitpix = 32; precision = 'float32';
            break;
        case   32:
            hdr.dime.bitpix = 64; precision = 'float32';
            break;
        case   64:
            hdr.dime.bitpix = 64; precision = 'float64';
            break;
        case  128:
            hdr.dime.bitpix = 24; precision = 'uint8';
            break;
        case  256:
            hdr.dime.bitpix = 8;  precision = 'int8';
            break;
        case  511:
            hdr.dime.bitpix = 96; precision = 'float32';
            break;
        case  512:
            hdr.dime.bitpix = 16; precision = 'uint16';
            break;
        case  768:
            hdr.dime.bitpix = 32; precision = 'uint32';
            break;
        case 1024:
            hdr.dime.bitpix = 64; precision = 'int64';
            break;
        case 1280:
            hdr.dime.bitpix = 64; precision = 'uint64';
            break;
        case 1792:
            hdr.dime.bitpix = 128; precision = 'float64';
            break;
        default:
            throw 'This datatype is not supported';
    }

    for (let index = 1; index < hdr.dime.dim.length; ++index) {
        if ( hdr.dime.dim[index] < 1 )
        {
            hdr.dime.dim[index] = 1;
        }
    }

    //  move pointer to the start of image block
    switch ( filetype )
    {
        case 0:
        case 1:
            fid.fseek(0, 'bof');
            break;
        case 2:
            fid.fseek(hdr.dime.vox_offset, 'bof');
            break;
    }

    //  Load whole image block for old Analyze format or binary image;
    //  otherwise, load images that are specified in img_idx, dim5_idx,
    //  dim6_idx, and dim7_idx
    //
    //  For binary image, we have to read all because pos can not be
    //  seeked in bit and can not be calculated the way below.
    let img_siz;
    if ( hdr.dime.datatype == 1 ||
        isequal(hdr.dime.dim.slice(3, 8), [1,1,1,1,1]) ||
        (
            img_idx.length == 0 &&
            dim5_idx.length == 0 &&
            dim6_idx.length == 0 &&
            dim7_idx.length == 0 &&
            slice_idx.length == 0
        )
    )
    {
        //  For each frame, precision of value will be read
        //  in img_siz times, where img_siz is only the
        //  dimension size of an image, not the byte storage
        //  size of an image.
        img_siz = prod(hdr.dime.dim.slice(1,8));

        //  For complex float32 or complex float64, voxel values
        //  include [real, imag]
        if ( hdr.dime.datatype == 32 || hdr.dime.datatype == 1792 )
        {
            img_siz = img_siz * 2;
        }

        // MPH: For RGB24, voxel values include 3 separate color planes
        if ( hdr.dime.datatype == 128 || hdr.dime.datatype == 511 )
        {
            img_siz = img_siz * 3;
        }

        img = fid.fread(img_siz, precision);

        let d3 = hdr.dime.dim[3];
        let d4 = hdr.dime.dim[4];
        let d5 = hdr.dime.dim[5];
        let d6 = hdr.dime.dim[6];
        let d7 = hdr.dime.dim[7];

        if ( slice_idx.length == 0 )
            slice_idx = Array.from(Array(d3).keys());

        if ( img_idx.length == 0 )
            img_idx = Array.from(Array(d4).keys());

        if ( dim5_idx.length == 0 )
            dim5_idx = Array.from(Array(d5).keys());

        if ( dim6_idx.length == 0 )
            dim6_idx = Array.from(Array(d6).keys());

        if ( dim7_idx.length == 0 )
            dim7_idx = Array.from(Array(d7).keys());
    }
    else
    {
        let d1 = hdr.dime.dim[1];
        let d2 = hdr.dime.dim[2];
        let d3 = hdr.dime.dim[3];
        let d4 = hdr.dime.dim[4];
        let d5 = hdr.dime.dim[5];
        let d6 = hdr.dime.dim[6];
        let d7 = hdr.dime.dim[7];

        if ( slice_idx.length == 0 )
            slice_idx = Array.from(Array(d3).keys());

        if ( img_idx.length == 0 )
            img_idx = Array.from(Array(d4).keys());

        if ( dim5_idx.length == 0 )
            dim5_idx = Array.from(Array(d5).keys());

        if ( dim6_idx.length == 0 )
            dim6_idx = Array.from(Array(d6).keys());

        if ( dim7_idx.length == 0 )
            dim7_idx = Array.from(Array(d7).keys());

        // ROMAN: begin
        let roman = 1;
        let currentIndex;
        img = [];
        if ( roman )
        {
            //  compute size of one slice
            img_siz = hdr.dime.dim[1] * hdr.dime.dim[2];

            //  For complex float32 or complex float64, voxel values
            //  include [real, imag]
            if ( hdr.dime.datatype == 32 | hdr.dime.datatype == 1792 )
            {
                img_siz = img_siz * 2;
            }

            //MPH: For RGB24, voxel values include 3 separate color planes
            if ( hdr.dime.datatype == 128 | hdr.dime.datatype == 511 )
            {
                img_siz = img_siz * 3;
            }

            currentIndex = 0;
        } // if(roman)
        // ROMAN: end

        for ( let i7 = 0; i7 < dim7_idx.length; i7++ )
        {
            for ( let i6 = 0; i6 < dim6_idx.length; i6++ )
            {
                for ( let i5 = 0; i5 < dim5_idx.length; i5++ )
                {
                    for ( let t = 0; t < img_idx.length; t++ )
                    {
                        for ( let s = 0; s < slice_idx.length; s++ )
                        {
                            //  Position is seeked in bytes. To convert dimension size
                            //  to byte storage size, hdr.dime.bitpix/8 will be
                            //  applied.

                            let pos = sub2ind([d1, d2, d3, d4, d5, d6, d7], 1, 1,
                                              slice_idx[s], img_idx[t],
                                              dim5_idx[i5], dim6_idx[i6], dim7_idx[i7]);

                            pos = pos * hdr.dime.bitpix / 8.0;

                            // ROMAN: begin
                            if ( roman )
                            {
                                // do nothing
                            }
                            else
                            {
                                img_siz = hdr.dime.dim[1] * hdr.dime.dim[2];

                                //  For complex float32 or complex float64, voxel values
                                //  include [real, imag]
                                if ( hdr.dime.datatype == 32 || hdr.dime.datatype == 1792 )
                                {
                                    img_siz = img_siz * 2;
                                }

                                // MPH: For RGB24, voxel values include 3 separate color planes
                                if ( hdr.dime.datatype == 128 || hdr.dime.datatype == 511 )
                                {
                                    img_siz = img_siz * 3;
                                }
                            } // if (roman)
                            // ROMAN: end
                            if ( filetype == 2 )
                            {
                                fid.fseek(pos + hdr.dime.vox_offset, 'bof');
                            }
                            else
                            {
                                fid.fseek(pos, 'bof');
                            }

                            //  For each frame, fread will read precision of value
                            //  in img_siz times
                            //
                            // ROMAN: begin
                            if ( roman )
                            {
                                img[currentIndex] = fid.fread(img_siz, precision);
                                currentIndex = currentIndex + 1;
                            }
                            else
                            {
                                img.push(fid.fread(img_siz, precision));
                            } //if(roman)
                            // ROMAN: end
                        }
                    }
                }
            }
        }
    }

    //  For complex float32 or complex float64, voxel values
    //  include [real, imag]
    if ( hdr.dime.datatype == 32 || hdr.dime.datatype == 1792 )
    {
        img = img.flat(Infinity);
        img_tmp = reshape(img, [2, img.length/2]);
        img = {};
        img = img_tmp[0];
        img.imaginary = img_tmp[1];

        //  Update the global min and max values
        hdr.dime.glmax.imaginary = img.imaginary[0];
        hdr.dime.glmax.real = img[0];

        hdr.dime.glmin.imaginary = img.imaginary[0];
        hdr.dime.glmin.real = img[0];

        for ( let i = 1; i < img.length; i++ )
        {
            if ( Math.hypot(hdr.dime.glmax.imaginary, hdr.dime.glmax.real) < Math.hypot(img.imaginary[i], img[i]) )
            {
                hdr.dime.glmax.imaginary = img.imaginary[i];
                hdr.dime.glmax.real = img[i];
            }
            else if ( Math.hypot(hdr.dime.glmin.imaginary, hdr.dime.glmin.real) > Math.hypot(img.imaginary[i], img[i]) )
            {
                hdr.dime.glmin.imaginary = img.imaginary[i];
                hdr.dime.glmin.real = img[i];
            }
            else if ( Math.hypot(hdr.dime.glmax.imaginary, hdr.dime.glmax.real) == Math.hypot(img.imaginary[i], img[i]) )
            {
                if ( Math.atan2(hdr.dime.glmax.imaginary, hdr.dime.glmax.real) < Math.atan2(img.imaginary[i], img[i]) )
                {
                    hdr.dime.glmax.imaginary = img.imaginary[i];
                    hdr.dime.glmax.real = img[i];
                }
            }
            else if ( Math.hypot(hdr.dime.glmin.imaginary, hdr.dime.glmin.real) == Math.hypot(img.imaginary[i], img[i]) )
            {
                if ( Math.atan2(hdr.dime.glmin.imaginary, hdr.dime.glmin.real) > Math.atan2(img.imaginary[i], img[i]) )
                {
                    hdr.dime.glmin.imaginary = img.imaginary[i];
                    hdr.dime.glmin.real = img[i];
                }
            }
        }
    }
    else
    {
        //  Update the global min and max values
        let img_tmp = structuredClone(img).flat(Infinity);
        for (let item of img_tmp) {
            if ( hdr.dime.glmax < item ) {
                hdr.dime.glmax = item;
            }

            if ( hdr.dime.glmin > item ) {
                hdr.dime.glmin = item;
            }
        }
    }

    fid.fclose();

    //  old_RGB treat RGB slice by slice, now it is treated voxel by voxel
    if ( old_RGB && hdr.dime.datatype == 128 && hdr.dime.bitpix == 24 )
    {
        // remove squeeze
        img = reshape(img, [hdr.dime.dim[1], hdr.dime.dim[2], 3, slice_idx.length, img_idx.length, dim5_idx.length, dim6_idx.length, dim7_idx.length]);
        img = permute(img, 0, 1, 3, 2, 4, 5, 6, 7);
    }
    else if (hdr.dime.datatype == 128 && hdr.dime.bitpix == 24)
    {
        // remove squeeze
        img = reshape(img, [3, hdr.dime.dim[1], hdr.dime.dim[2], slice_idx.length, img_idx.length, dim5_idx.length, dim6_idx.length, dim7_idx.length]);
        img = permute(img, 1, 2, 3, 0, 4, 5, 6, 7);
    }
    else if (hdr.dime.datatype == 511 && hdr.dime.bitpix == 96)
    {
        for ( let i = 0; i < img.length; i++ )
        {
            img[i] = (img[i] - hdr.dime.glmin) / (hdr.dime.glmax - hdr.dime.glmin);
        }

        // remove squeeze
        img = reshape(img, [3, hdr.dime.dim[1], hdr.dime.dim[2], slice_idx.length, img_idx.length, dim5_idx.length, dim6_idx.length, dim7_idx.length]);
        img = permute(img, 1, 2, 3, 0, 4, 5, 6, 7);
    }
    else
    {
        // remove squeeze
        img = reshape(img, [hdr.dime.dim[1], hdr.dime.dim[2], slice_idx.length, img_idx.length, dim5_idx.length, dim6_idx.length, dim7_idx.length]);
    }

    if ( slice_idx.length != 0 )
        hdr.dime.dim[3] = slice_idx.length;

    if ( img_idx.length != 0 )
        hdr.dime.dim[4] = img_idx.length;

    if ( dim5_idx.length != 0 )
        hdr.dime.dim[5] = dim5_idx.length;

    if ( dim6_idx.length != 0 )
        hdr.dime.dim[6] = dim6_idx.length;

    if ( dim7_idx.length != 0 )
        hdr.dime.dim[7] = dim7_idx.length;

    while (img.length == 1)
    {
        img = img[0];
    }

    return [img, hdr];
}


