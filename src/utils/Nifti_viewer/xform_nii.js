//   _    _ _                              _
//  | |  | (_)                            | |
//  | |  | |_ _ __ ___  ___ _ __ __ _  ___| | _____ _ __
//  | |/\| | | '__/ _ \/ __| '__/ _` |/ __| |/ / _ \ '__|
//  \  /\  / | | |  __/ (__| | | (_| | (__|   <  __/ |
//   \/  \/|_|_|  \___|\___|_|  \__,_|\___|_|\_\___|_|
//
//
//  'xform_nii.m' is an internal function called by "load_nii.m", so
//  you do not need run this program by yourself. It does simplified
//  NIfTI sform/qform affine transform, and supports some of the
//  affine transforms, including translation, reflection, and
//  orthogonal rotation (N*90 degree).
//
//  For other affine transforms, e.g. any degree rotation, shearing
//  etc. you will have to use the included 'reslice_nii.m' program
//  to reslice the image volume. 'reslice_nii.m' is not called by
//  any other program, and you have to run 'reslice_nii.m' explicitly
//  for those NIfTI files that you want to reslice them.
//
//  Since 'xform_nii.m' does not involve any interpolation or any
//  slice change, the original image volume is supposed to be
//  untouched, although it is translated, reflected, or even
//  orthogonally rotated, based on the affine matrix in the
//  NIfTI header.
//
//  However, the affine matrix in the header of a lot NIfTI files
//  contain slightly non-orthogonal rotation. Therefore, optional
//  input parameter 'tolerance' is used to allow some distortion
//  in the loaded image for any non-orthogonal rotation or shearing
//  of NIfTI affine matrix. If you set 'tolerance' to 0, it means
//  that you do not allow any distortion. If you set 'tolerance' to
//  1, it means that you do not care any distortion. The image will
//  fail to be loaded if it can not be tolerated. The tolerance will
//  be set to 0.1 (10%), if it is default or empty.
//
//  Because 'reslice_nii.m' has to perform 3D interpolation, it can
//  be slow depending on image size and affine matrix in the header.
//
//  After you perform the affine transform, the 'nii' structure
//  generated from 'xform_nii.m' or new NIfTI file created from
//  'reslice_nii.m' will be in RAS orientation, i.e. X axis from
//  Left to Right, Y axis from Posterior to Anterior, and Z axis
//  from Inferior to Superior.
//
//  NOTE: This function should be called immediately after load_nii.
//
//  Usage: [ nii ] = xform_nii(nii, [tolerance], [preferredForm])
//
//  nii	- NIFTI structure (returned from load_nii)
//
//  @param {number} [tolerance]  -  distortion allowed for non-orthogonal rotation
//	or shearing in NIfTI affine matrix. It will be set to 0.1 (10%),
//	if it is default or empty.
//
//  @param {char} [preferredForm]  -  selects which transformation from voxels
//	to RAS coordinates; values are s,q,S,Q.  Lower case s,q indicate
//	"prefer sform or qform, but use others if preferred not present".
//	Upper case indicate the program is forced to use the specificied
//	tranform or fail loading.  'preferredForm' will be 's', if it is
//	default or empty.	- Jeff Gunter
//
//  NIFTI data format can be found on: http://nifti.nimh.nih.gov
//
//  - Jimmy Shen (jimmy@rotman-baycrest.on.ca)
//
//  This version is ported from original MatLab script into JavaScript by Wirecracker team and distributed under MIT license.

import { flip, isequal, ndims, permute, prod, reshape, find, det, transpose, diag, bitset, inv } from "./matlab_functions.js";

export default function xform_nii ( nii, tolerance = 0.1, preferredForm = 's' )
{
    //  save a copy of the header as it was loaded.  This is the
    //  header before any sform, qform manipulation is done.
    nii.original = {}
    nii.original.hdr = structuredClone(nii.hdr);

    if ( tolerance <= 0 )
    {
        tolerance = Number.EPSILON;
    }

    //  if scl_slope field is nonzero, then each voxel value in the
    //  dataset should be scaled as: y = scl_slope * x + scl_inter
    //  I bring it here because hdr will be modified by change_hdr.
    if ( nii.hdr.dime.scl_slope != 0 &&
        [2,4,8,16,64,256,512,768].includes(nii.hdr.dime.datatype) &&
        ( nii.hdr.dime.scl_slope != 1 || nii.hdr.dime.scl_inter != 0 ))
    {
        forAllElements( nii.img, function(element) {
            element = nii.hdr.dime.scl_slope * element + nii.hdr.dime.scl_inter;
        });

        if ( nii.hdr.dime.datatype == 64 )
        {
            nii.hdr.dime.datatype = 64;
            nii.hdr.dime.bitpix = 64;
        }
        else
        {
         nii.hdr.dime.datatype = 16;
         nii.hdr.dime.bitpix = 32;
        }

        //  Update the global min and max values
        let img_tmp = structuredClone(nii.img).flat(Infinity);
        for (let item of img_tmp) {
            if ( hdr.dime.glmax < item ) {
                hdr.dime.glmax = item;
            }

            if ( hdr.dime.glmin > item ) {
                hdr.dime.glmin = item;
            }
        }

        //  set scale to non-use, because it is applied in xform_nii
        nii.hdr.dime.scl_slope = 0;
    }

    //  However, the scaling is to be ignored if datatype is DT_RGB24.

    //  If datatype is a complex type, then the scaling is to be applied
    //  to both the real and imaginary parts.
    if ( nii.hdr.dime.scl_slope != 0 &&
        [32,1792].includes(nii.hdr.dime.datatype))
    {
        forAllElements( nii.img, function(element) {
            element = nii.hdr.dime.scl_slope * element + nii.hdr.dime.scl_inter;
        });

        [nii.hdr.dime.glmax.real, nii.hdr.dime.glmax.imaginary, nii.hdr.dime.glmin.real, nii.hdr.dime.glmin.imaginary] =
        findMinMaxComplex(nii.img);

        //  set scale to non-use, because it is applied in xform_nii
        nii.hdr.dime.scl_slope = 0;
    }

    if ( nii.filetype == 0 )
    {
        nii.hdr.hist.rot_orient = [];
        nii.hdr.hist.flip_orient = [];
        return nii; //  no sform/qform for Analyze format
    }

    let hdr = nii.hdr;
    let orient;
    [hdr, orient] = change_hdr(hdr, tolerance, preferredForm);

    //  flip and/or rotate image data
    if ( !isequal(orient, [1,2,3]) )
    {
        let old_dim = hdr.dime.dim.slice(1,4);

        let pattern = [];
        //  More than 1 time frame
        if ( ndims(nii.img) > 3 )
        {
            pattern = Array.from(Array(prod(old_dim)).keys());
            pattern = reshape(pattern, old_dim);
        }

        //  calculate for rotation after flip
        let rot_orient = [];

        //  do flip:
        let flip_orient = [];

        for ( let i = 0; i < orient.length; i++ )
        {
            rot_orient[i] = (orient[i] + 2) % 3 + 1;
            flip_orient[i] = orient[i] - rot_orient[i];
        }

        for ( let i = 0; i < 3; i++ )
        {
            if ( flip_orient[i] )
            {
                if ( pattern.length != 0 )
                {
                    pattern = flip(pattern, i);
                }
                else
                {
                    nii.img = flip(nii.img, i);
                }
            }
        }

        //  get index of orient (rotate inversely)
        let tmp = structuredClone(rot_orient);
        tmp.sort();
        rot_orient = rot_orient.map((x) => tmp.indexOf(x));

        tmp = hdr.hist.originator.slice(0,3);

        let old_pixdim = structuredClone(hdr.dime.pixdim);
        let old_tmp = structuredClone(tmp);
        let old_flip_orient = structuredClone(flip_orient);
        for ( let i = 0; i < rot_orient.length; i++ )
        {
            hdr.dime.dim[i + 1] = old_dim[rot_orient[i]];
            hdr.dime.pixdim[i + 1] = old_pixdim[rot_orient[i] + 1];

            //  re-calculate originator
            tmp[i] = old_tmp[rot_orient[i]];
            flip_orient[i] = old_flip_orient[rot_orient[i]];
        }

        for ( let i = 0; i < 3; i++ )
        {
            if ( flip_orient[i] && (tmp[i] != 0) )
            {
                tmp[i] = hdr.dime.dim[i + 1] - tmp[i] + 1;
            }
            hdr.hist.originator[i] = tmp[i];
        }

        hdr.hist.rot_orient = rot_orient;
        hdr.hist.flip_orient = flip_orient;

        let new_dim = hdr.dime.dim.slice(1,4);
        //  do rotation:
        if ( pattern.length != 0 )
        {
            pattern = permute(pattern, rot_orient).flat(Infinity);

            if ( hdr.dime.datatype == 32 | hdr.dime.datatype == 1792 |
                hdr.dime.datatype == 128 | hdr.dime.datatype == 511 )
            {
                let temp = indexArray(nii.img,":",":",":",1);

                tmp = reshape(temp, [prod(new_dim)].concat(hdr.dime.dim.slice(4,8)));
                tmp = indexArray(tmp, pattern, ":");
                temp = reshape(tmp, new_dim.concat(hdr.dime.dim.slice(4,8)));

                temp = indexArray(nii.img,":",":",":",2);
                tmp = reshape(temp, [prod(new_dim)].concat(hdr.dime.dim.slice(4,8)));
                tmp = indexArray(tmp, pattern, ":");
                temp = reshape(tmp, new_dim.concat(hdr.dime.dim.slice(4,8)));

                if ( hdr.dime.datatype == 128 | hdr.dime.datatype == 511 )
                {
                    temp = indexArray(nii.img,":",":",":",3);
                    tmp = reshape(temp, [prod(new_dim)].concat(hdr.dime.dim.slice(4,8)));
                    tmp = indexArray(tmp, pattern, ":");
                    temp = reshape(tmp, new_dim.concat(hdr.dime.dim.slice(4,8)));
                }
            }
            else
            {
                nii.img = reshape(nii.img, [prod(new_dim)].concat(hdr.dime.dim.slice(4,8)));
                nii.img = indexArray(nii.img, pattern, ":");
                nii.img = reshape(nii.img, new_dim.concat(hdr.dime.dim.slice(4,8)));
            }
        }
        else
        {
            if ( hdr.dime.datatype == 32 | hdr.dime.datatype == 1792 |
            hdr.dime.datatype == 128 | hdr.dime.datatype == 511 )
            {
                let temp = indexArray(nii.img,":",":",":",1);
                temp = permute(temp, rot_orient);

                temp = indexArray(nii.img,":",":",":",2);
                temp = permute(temp, rot_orient);

                if ( hdr.dime.datatype == 128 | hdr.dime.datatype == 511 )
                {
                    temp = indexArray(nii.img,":",":",":",3);
                    temp = permute(temp, rot_orient);
                }
            }
            else
            {
                nii.img = permute(nii.img, rot_orient);
            }
        }
    }
    else
    {
        hdr.hist.rot_orient = [];
        hdr.hist.flip_orient = [];
    }

    nii.hdr = hdr;

    return nii;
}

function change_hdr(hdr, tolerance, preferredForm)
{

   let orient = [1, 2, 3];
   let affine_transform = 1;

   //  NIFTI can have both sform and qform transform. This program
   //  will check sform_code prior to qform_code by default.
   //
   //  If user specifys "preferredForm", user can then choose the
   //  priority.					- Jeff
   let useForm = [];					// Jeff

   if (preferredForm == 'S')
   {
       if (hdr.hist.sform_code == 0)
       {
           throw 'User requires sform, sform not set in header';
       }
       else
       {
           useForm='s';
       }
   }					// Jeff

   if (preferredForm == 'Q')
   {
       if (hdr.hist.sform_code == 0)
       {
           throw 'User requires qform, qform not set in header';
       }
       else
       {
           useForm='q';
       }
   }						// Jeff

   if  (preferredForm == 's')
   {
       if (hdr.hist.sform_code > 0)
       {
           useForm='s';
       }
       else if (hdr.hist.qform_code > 0)
       {
           useForm='q';
       }
   }						// Jeff

   if  (preferredForm == 'q')
   {
       if (hdr.hist.qform_code > 0)
       {
           useForm='q';
       }
       else if (hdr.hist.sform_code > 0)
       {
           useForm='s';
       }
   }						// Jeff

   let R = [];
   let T = [];
   if (useForm == 's')
   {
      R = [hdr.hist.srow_x.slice(0,3),
           hdr.hist.srow_y.slice(0,3),
           hdr.hist.srow_z.slice(0,3)];

      T = [hdr.hist.srow_x[3],
           hdr.hist.srow_y[3],
           hdr.hist.srow_z[3]];

      let R_flat = structuredClone(R).flat(Infinity);
      let R_non_zero = find(R);
      for (let i = 0; i < R_non_zero.length; i++)
      {
          R_non_zero[i] = R_flat[R_non_zero[i]];
      }

      if (det(R) == 0 | !isequal(R_non_zero, transpose(sumMatrix(R))))
      {
         hdr.hist.old_affine = constructHomogeneousMatrix(R, T);
         let R_sort = structuredClone(R).flat(Infinity).sort();

         forAllElements(R_sort, function (item){
             item = Math.abs(item);
         });
         for (let i = 0; i < R.length; i++) {
             for (let j = 0; j < R[i].length; j++) {
                 if (Math.abs(R[i][j]) < tolerance * Math.min(R_sort[R_sort.length - 3], R_sort[R_sort.length - 2], R_sort[R_sort.length - 1])) {
                     R[i][j] = 0;
                 }
             }
         }

         hdr.hist.new_affine = constructHomogeneousMatrix(R, T);

         let R_flat = structuredClone(R).flat(Infinity);
         let R_non_zero = find(R);
         for (let i = 0; i < R_non_zero.length; i++)
         {
             R_non_zero[i] = R_flat[R_non_zero[i]];
         }

         if (det(R) == 0 | !isequal(R_non_zero, transpose(sumMatrix(R))))
         {
             let error_msg = '\n\n   Non-orthogonal rotation or shearing found inside the affine matrix\n';
             error_msg = error_msg + '   in this NIfTI file. You have 3 options:\n\n';
             error_msg = error_msg + '   1. Using included "reslice_nii.m" program to reslice the NIfTI\n';
             error_msg = error_msg + '      file. I strongly recommand this, because it will not cause\n';
             error_msg = error_msg + '      negative effect, as long as you remember not to do slice\n';
             error_msg = error_msg + '      time correction after using "reslice_nii.m".\n\n';
             error_msg = error_msg + '   2. Using included "load_untouch_nii.m" program to load image\n';
             error_msg = error_msg + '      without applying any affine geometric transformation or\n';
             error_msg = error_msg + '      voxel intensity scaling. This is only for people who want\n';
             error_msg = error_msg + '      to do some image processing regardless of image orientation\n';
             error_msg = error_msg + '      and to save data back with the same NIfTI header.\n\n';
             error_msg = error_msg + '   3. Increasing the tolerance to allow more distortion in loaded\n';
             error_msg = error_msg + '      image, but I do not suggest this.\n\n';
             error_msg = error_msg + '   To get help, please visit: {URL for help}\n\n';
             // throw error_msg;
             console.log(error_msg);
         }
      }
   }
   else if (useForm =='q')
   {
       let b = hdr.hist.quatern_b;
       let c = hdr.hist.quatern_c;
       let d = hdr.hist.quatern_d;

       let a;
       if (1.0 - (b * b + c * c + d * d) < 0) {
           if (Math.abs(1.0 - (b * b + c * c + d * d)) < 1e-5) {
               a = 0;
           } else {
               throw 'Incorrect quaternion values in this NIFTI data.';
           }
       } else {
           a = Math.sqrt(1.0 - (b * b + c * c + d * d));
       }

       let qfac = hdr.dime.pixdim[0];
       if (qfac === 0) qfac = 1;
       let i = hdr.dime.pixdim[1];
       let j = hdr.dime.pixdim[2];
       let k = qfac * hdr.dime.pixdim[3];

       R = transpose([
           [a*a+b*b-c*c-d*d, 2*b*c-2*a*d,     2*b*d+2*a*c],
           [2*b*c+2*a*d,     a*a+c*c-b*b-d*d, 2*c*d-2*a*b],
           [2*b*d-2*a*c,     2*c*d+2*a*b,     a*a+d*d-c*c-b*b]
       ]);

      T = [hdr.hist.qoffset_x,
           hdr.hist.qoffset_y,
           hdr.hist.qoffset_z];

      //  qforms are expected to generate rotation matrices R which are
      //  det(R) = 1; we'll make sure that happens.
      //
      //  now we make the same checks as were done above for sform data
      //  BUT we do it on a transform that is in terms of voxels not mm;
      //  after we figure out the angles and squash them to closest
      //  rectilinear direction. After that, the voxel sizes are then
      //  added.
      //
      //  This part is modified by Jeff Gunter.

      let R_flat = structuredClone(R).flat(Infinity);
      let R_non_zero = find(R);
      for (let i = 0; i < R_non_zero.length; i++)
      {
          R_non_zero[i] = R_flat[R_non_zero[i]];
      }

      if (det(R) == 0 | !isequal(R_non_zero, transpose(sumMatrix(R))))
      {

         //  det(R) == 0 is not a common trigger for this ---
         //  R(find(R)) is a list of non-zero elements in R; if that
         //  is straight (not oblique) then it should be the same as
         //  columnwise summation. Could just as well have checked the
         //  lengths of R(find(R)) and sum(R)' (which should be 3)
         hdr.hist.old_affine = constructHomogeneousMatrix(multiplyMatrix(R, diag([i, j, k])), T);

         let R_sort = structuredClone(R).flat(Infinity).sort();
         forAllElements(R_sort, function (item){
             item = Math.abs(item);
         });
         for (let i = 0; i < R.length; i++) {
             for (let j = 0; j < R[i].length; j++) {
                 if (Math.abs(R[i][j]) < tolerance * Math.min(R_sort[R_sort.length - 3], R_sort[R_sort.length - 2], R_sort[R_sort.length - 1])) {
                     R[i][j] = 0;
                 }
             }
         }

         R = multiplyMatrix(R, diag([i, j, k]));
         hdr.hist.new_affine = constructHomogeneousMatrix(R, T);

         let R_flat = structuredClone(R).flat(Infinity);
         let R_non_zero = find(R);
         for (let i = 0; i < R_non_zero.length; i++)
         {
             R_non_zero[i] = R_flat[R_non_zero[i]];
         }

         if (det(R) == 0 | !isequal(R_non_zero, transpose(sumMatrix(R))))
         {
             let error_msg = '\n\n   Non-orthogonal rotation or shearing found inside the affine matrix\n';
             error_msg = error_msg + '   in this NIfTI file. You have 3 options:\n\n';
             error_msg = error_msg + '   1. Using included "reslice_nii.m" program to reslice the NIfTI\n';
             error_msg = error_msg + '      file. I strongly recommand this, because it will not cause\n';
             error_msg = error_msg + '      negative effect, as long as you remember not to do slice\n';
             error_msg = error_msg + '      time correction after using "reslice_nii.m".\n\n';
             error_msg = error_msg + '   2. Using included "load_untouch_nii.m" program to load image\n';
             error_msg = error_msg + '      without applying any affine geometric transformation or\n';
             error_msg = error_msg + '      voxel intensity scaling. This is only for people who want\n';
             error_msg = error_msg + '      to do some image processing regardless of image orientation\n';
             error_msg = error_msg + '      and to save data back with the same NIfTI header.\n\n';
             error_msg = error_msg + '   3. Increasing the tolerance to allow more distortion in loaded\n';
             error_msg = error_msg + '      image, but I do not suggest this.\n\n';
             error_msg = error_msg + '   To get help, please visit: {URL for help}\n\n';
             // throw error_msg;
             console.log(error_msg);
         }
      }
      else
      {
         R = multiplyMatrix(R, diag([i, j, k]));
      }					// 1st det(R)
   }
   else
   {
      affine_transform = 0;	// no sform or qform transform
   }

   if (affine_transform == 1)
   {
      let voxel_size = Math.abs(sumMatrix(R));
      let inv_R = inv(R);
      forAllElements(T, function(element) {
          element = -1 * element;
      })
      let originator = inv_R*(T)+1;
      orient = get_orient(inv_R);

      //  modify pixdim and originator
      hdr.dime.pixdim[1] = voxel_size[0];
      hdr.dime.pixdim[2] = voxel_size[1];
      hdr.dime.pixdim[3] = voxel_size[2];
      hdr.hist.originator[0] = originator[0];
      hdr.hist.originator[1] = originator[1];
      hdr.hist.originator[2] = originator[2];

      //  set sform or qform to non-use, because they have been
      //  applied in xform_nii
      hdr.hist.qform_code = 0;
      hdr.hist.sform_code = 0;
   }

   //  apply space_unit to pixdim if not 1 (mm)
   let space_unit = get_units(hdr);

   if (space_unit != 1)
   {
       hdr.dime.pixdim[1] = hdr.dime.pixdim[1] * space_unit;
       hdr.dime.pixdim[2] = hdr.dime.pixdim[2] * space_unit;
       hdr.dime.pixdim[3] = hdr.dime.pixdim[3] * space_unit;

       //  set space_unit of xyzt_units to millimeter, because
       //  voxel_size has been re-scaled
       hdr.dime.xyzt_units = String.fromCharCode(bitset(hdr.dime.xyzt_units,1,0));
       hdr.dime.xyzt_units = String.fromCharCode(bitset(hdr.dime.xyzt_units,2,1));
       hdr.dime.xyzt_units = String.fromCharCode(bitset(hdr.dime.xyzt_units,3,0));
   }

   hdr.dime.pixdim = hdr.dime.pixdim.map(Math.abs);

   return [hdr, orient];					// change_hdr
}

//-----------------------------------------------------------------------
function get_orient(R)
{
   let orient = [];

   for( let i = 0; i < 3; i++ )
   {
       let arr = indexArray(R,i,":");
       let sum = arr.reduce((acc, num) => acc * num, 1);
       switch ( find(indexArray(R,i,":")) * Math.sign(sum) )
       {
           case 1:
               orient.push(1);		// Left to Right
               break;
           case 2:
               orient.push(2);		// Posterior to Anterior
               break;
           case 3:
               orient.push(3);		// Inferior to Superior
               break;
           case -1:
               orient.push(4);		// Right to Left
               break;
           case -2:
               orient.push(5);		// Anterior to Posterior
               break;
           case -3:
               orient.push(6);		// Superior to Inferior
               break;
       }
   }

   return orient;					// get_orient
}

//-----------------------------------------------------------------------
function get_units(hdr)
{

    let space_unit, time_unit;

    switch (hdr.dime.xyzt_units & 7)	// mask with 0x07
    {
        case 1:
            space_unit = 1e+3;		// meter, m
            break;
        case 3:
            space_unit = 1e-3;		// micrometer, um
            break;
        default:
            space_unit = 1;			// millimeter, mm
            break;
    }
    switch (hdr.dime.xyzt_units & 56)	// mask with 0x38
    {
        case 16:
            time_unit = 1e-3;			// millisecond,
            break;
        case 24:
            time_unit = 1e-6;			// microsecond, us
            break;
        default:
            time_unit = 1;			// second, s
            break;
    }

    return [space_unit, time_unit];					// get_units
}

function forAllElements(array, callback)
{
    for (let i = 0; i < array.length; i++) {
        if (Array.isArray(array[i])) {
            forAllElements(array[i], callback); // Recursive call for nested arrays
        } else {
            callback(array[i]);
        }
    }
}

function findMinMaxComplex ( array )
{
    let tempArray = structuredClone(array).flat(Infinity);

    let max_imaginary, max_real, min_imaginary, min_real;

    max_imaginary = tempArray.imaginary[0];
    max_real = tempArray[0];
    min_imaginary = tempArray.imaginary[0];
    min_real = tempArray[0];

    for ( let i = 1; i < tempArray.length; i++ )
    {
        if ( Math.hypot(max_imaginary, max_real) < Math.hypot(tempArray.imaginary[i], tempArray[i]) )
        {
            max_imaginary = tempArray.imaginary[i];
            max_real = tempArray[i];
        }
        else if ( Math.hypot(min_imaginary, min_real) > Math.hypot(tempArray.imaginary[i], tempArray[i]) )
        {
            min_imaginary = tempArray.imaginary[i];
            min_real = tempArray[i];
        }
        else if ( Math.hypot(max_imaginary, max_real) == Math.hypot(tempArray.imaginary[i], tempArray[i]) )
        {
            if ( Math.atan2(max_imaginary, max_real) < Math.atan2(tempArray.imaginary[i], tempArray[i]) )
            {
                max_imaginary = tempArray.imaginary[i];
                max_real = tempArray[i];
            }
        }
        else if ( Math.hypot(min_imaginary, min_real) == Math.hypot(tempArray.imaginary[i], tempArray[i]) )
        {
            if ( Math.atan2(min_imaginary, min_real) > Math.atan2(tempArray.imaginary[i], tempArray[i]) )
            {
                min_imaginary = tempArray.imaginary[i];
                min_real = tempArray[i];
            }
        }
    }

    return [max_real, max_imaginary, min_real, min_imaginary];
}

//  For colons in matlab
function indexArray(arr, range = ":", ...rest) {
    // Convert range into valid indices
    function parseRange(range, maxLength) {
        if (range === ":") return Array.from({ length: maxLength }, (_, i) => i); // Select all
        if (Array.isArray(range)) return range; // If already an array, use it
        return [range];
    }
    let rowIndices = parseRange(range, arr.length);
    if (rest != [])
    {
        return rowIndices.map(row => indexArray(arr[row], ...rest));
    }

    return rowIndices.map(row => arr[row]);
}

function sumMatrix(matrix) {
    return matrix.map(row => row.reduce((sum, val) => sum + val, 0));
}

function constructHomogeneousMatrix(R, T) {
    let H = [
        [...R[0], 0],
        [...R[1], 0],
        [...R[2], 0],
        [...T, 1]
    ];
    return H;
}

function multiplyMatrix(A, B) {
    // Initialize a 3x3 matrix for the result
    let C = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
    ];

    // Perform matrix multiplication
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            for (let k = 0; k < 3; k++) {
                C[i][j] += A[i][k] * B[k][j];
            }
        }
    }

    return C;
}
