//   _    _ _                              _
//  | |  | (_)                            | |
//  | |  | |_ _ __ ___  ___ _ __ __ _  ___| | _____ _ __
//  | |/\| | | '__/ _ \/ __| '__/ _` |/ __| |/ / _ \ '__|
//  \  /\  / | | |  __/ (__| | | (_| | (__|   <  __/ |
//   \/  \/|_|_|  \___|\___|_|  \__,_|\___|_|\_\___|_|
//
//
//  Automatically flip NIFTI image data to have right on right
//  Only works on 3D B&W nii image. Will not work on colored ones, ones with imaginary numbers, and ones with 4 dimension
//
//  Usage: nii = open_nii_anatomical_convention (nii)
//
//  @param {Object} nii  - 	NIFTI file data loaded using load_nifti.js or load_untouch_nifti.js
//
//  @returns {nii}  a object containing flipped NIFTI header and data
//
//  nii structure:
//
//	hdr -		struct with NIFTI header fields.
//
//	img - 		3D matrix of NIFTI data.
//
//  rotation - 		Permutad identity matrix representing the rotation done on the image
//
//  rot_dim - 		Array representing the rotation done on the image
//
//  flip - 		Array representing which axis had reversing operation
//
// - Medina Villalon Samuel ___ samuel.medina@ap-hm.fr ___
// - Paz Rodrigo
// - Roehri Nicolas
// - Benar Christian
// - Bartolomei Fabrice
//
//  This version is ported from original MatLab script into JavaScript by Wirecracker team and distributed under MIT license.

import { permute, flip } from './matlab_functions.js'

export default function nifti_anatomical_convention (nii)
{
    let final_flip = [0,0,0];
    let rot_dim = [0,1,2];
    let rot = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
    ];


    let xmax_pos = max_abs_pos(nii.hdr.hist.srow_x.slice(0, 3));
    let image = nii.img;

    // the -1 indicates neuro convention, otherwise radio convention

    // Test to take account of all orientations
    // Added for freesurfer or other support; When the matrix is not diagonal

    if ( xmax_pos == 0 )
    {
        if ( nii.hdr.hist.srow_x[xmax_pos] < 0 )
        {
            flip(image, 2);
            final_flip[0] = 1;
            nii.hdr.hist.srow_x[xmax_pos] = -1 * nii.hdr.hist.srow_x[xmax_pos];
            nii.hdr.hist.srow_y[xmax_pos] = -1 * nii.hdr.hist.srow_y[xmax_pos];
            nii.hdr.hist.srow_z[xmax_pos] = -1 * nii.hdr.hist.srow_z[xmax_pos];
        }
    }
    else if ( xmax_pos == 1 )
    {
        image = permute(image, [1,0,2]);
        if ( nii.hdr.hist.srow_x[xmax_pos] < 0 )
        {
            flip(image, 2);
            final_flip[0] = 1;
            nii.hdr.hist.srow_x[xmax_pos] = -1 * nii.hdr.hist.srow_x[xmax_pos];
            nii.hdr.hist.srow_y[xmax_pos] = -1 * nii.hdr.hist.srow_y[xmax_pos];
            nii.hdr.hist.srow_z[xmax_pos] = -1 * nii.hdr.hist.srow_z[xmax_pos];
        }

        [nii.hdr.hist.srow_x[0], nii.hdr.hist.srow_x[1]] = [nii.hdr.hist.srow_x[1], nii.hdr.hist.srow_x[0]];
        [nii.hdr.hist.srow_y[0], nii.hdr.hist.srow_y[1]] = [nii.hdr.hist.srow_y[1], nii.hdr.hist.srow_y[0]];
        [nii.hdr.hist.srow_z[0], nii.hdr.hist.srow_z[1]] = [nii.hdr.hist.srow_z[1], nii.hdr.hist.srow_z[0]];

        rot_dim = [1,0,2];
        rot = [
            [0, 1, 0],
            [1, 0, 0],
            [0, 0, 1],
        ];

        let old_dim = nii.hdr.dime.dim.slice(1, 4);
        for ( let loc = 0; loc < rot_dim.length; loc++ )
        {
            nii.hdr.dime.dim[loc + 1] = old_dim[rot_dim[loc]];
        }
    }
    else if ( xmax_pos == 2 )
    {
        image = permute(image, [2,0,1]);
        if ( nii.hdr.hist.srow_x[xmax_pos] < 0 )
        {
            flip(image, 2);
            final_flip[0] = 1;
            nii.hdr.hist.srow_x[xmax_pos] = -1 * nii.hdr.hist.srow_x[xmax_pos];
            nii.hdr.hist.srow_y[xmax_pos] = -1 * nii.hdr.hist.srow_y[xmax_pos];
            nii.hdr.hist.srow_z[xmax_pos] = -1 * nii.hdr.hist.srow_z[xmax_pos];
        }

        nii.hdr.hist.srow_x = [nii.hdr.hist.srow_x[2], nii.hdr.hist.srow_x[0], nii.hdr.hist.srow_x[1], nii.hdr.hist.srow_x[3]];
        nii.hdr.hist.srow_y = [nii.hdr.hist.srow_y[2], nii.hdr.hist.srow_y[0], nii.hdr.hist.srow_y[1], nii.hdr.hist.srow_y[3]];
        nii.hdr.hist.srow_z = [nii.hdr.hist.srow_z[2], nii.hdr.hist.srow_z[0], nii.hdr.hist.srow_z[1], nii.hdr.hist.srow_z[3]];

        rot_dim = [2,0,1];
        rot = [
            [0, 0, 1],
            [1, 0, 0],
            [0, 1, 0]
        ];

        let old_dim = nii.hdr.dime.dim.slice(1, 4);
        for ( let loc = 0; loc < rot_dim.length; loc++ )
        {
            nii.hdr.dime.dim[loc + 1] = old_dim[rot_dim[loc]];
        }
    }


    let ymax_pos = max_abs_pos(nii.hdr.hist.srow_y.slice(0, 3));
    let zmax_pos = max_abs_pos(nii.hdr.hist.srow_z.slice(0, 3));

    if ( ymax_pos == 1 || ( ymax_pos == 2 && zmax_pos == 2 ) )
    {
        if ( nii.hdr.hist.srow_y[ymax_pos] < 0 )
        {
            flip(image, 1);

            final_flip[1] = 1;
            nii.hdr.hist.srow_x[ymax_pos] = -1 * nii.hdr.hist.srow_x[ymax_pos];
            nii.hdr.hist.srow_y[ymax_pos] = -1 * nii.hdr.hist.srow_y[ymax_pos];
            nii.hdr.hist.srow_z[ymax_pos] = -1 * nii.hdr.hist.srow_z[ymax_pos];
        }
    }
    else if ( ymax_pos == 2 )
    {
        image = permute(image, [0,2,1]);
        nii.hdr.hist.srow_x = [nii.hdr.hist.srow_x[0], nii.hdr.hist.srow_x[2], nii.hdr.hist.srow_x[1], nii.hdr.hist.srow_x[3]];
        nii.hdr.hist.srow_y = [nii.hdr.hist.srow_y[0], nii.hdr.hist.srow_y[2], nii.hdr.hist.srow_y[1], nii.hdr.hist.srow_y[3]];
        nii.hdr.hist.srow_z = [nii.hdr.hist.srow_z[0], nii.hdr.hist.srow_z[2], nii.hdr.hist.srow_z[1], nii.hdr.hist.srow_z[3]];
        rot_dim = [0,2,1];
        rot = [
            [1, 0, 0],
            [0, 0, 1],
            [0, 1, 0],
        ];
        let old_dim = nii.hdr.dime.dim.slice(1, 4);
        for ( let loc = 0; loc < rot_dim.length; loc++ )
        {
            nii.hdr.dime.dim[loc + 1] = old_dim[rot_dim[loc]];
        }

        if ( nii.hdr.hist.srow_y[1] < 0 )
        {
            flip(image, 1);

            final_flip[1] = 1;
            nii.hdr.hist.srow_x[1] = -1 * nii.hdr.hist.srow_x[1];
            nii.hdr.hist.srow_y[1] = -1 * nii.hdr.hist.srow_y[1];
            nii.hdr.hist.srow_z[1] = -1 * nii.hdr.hist.srow_z[1];
        }
    }

    zmax_pos = max_abs_pos(nii.hdr.hist.srow_z.slice(0, 3));
    if ( zmax_pos == 2 )
    {
        if ( nii.hdr.hist.srow_z[zmax_pos] < 0 )
        {
            flip(image, 0);

            final_flip[2] = 1;
            nii.hdr.hist.srow_x[zmax_pos] = -1 * nii.hdr.hist.srow_x[zmax_pos];
            nii.hdr.hist.srow_y[zmax_pos] = -1 * nii.hdr.hist.srow_y[zmax_pos];
            nii.hdr.hist.srow_z[zmax_pos] = -1 * nii.hdr.hist.srow_z[zmax_pos];
        }
    }

    nii.img = image;
    nii.rotation = rot;
    nii.rot_dim = rot_dim;
    nii.flip = final_flip;
    let old_pixdim = nii.hdr.dime.pixdim.slice(1, 4);
    for ( let loc = 0; loc < rot_dim.length; loc++ )
    {
        nii.hdr.dime.pixdim[loc + 1] = old_pixdim[rot_dim[loc]];
    }

    return nii;
}


function max_abs_pos( array )
{
    let max = Math.abs(array[0]);
    let pos = 0;
    for ( let i = 1; i < array.length; i++ )
    {
        if ( max < Math.abs(array[i]) )
        {
            pos = i;
            max = Math.abs(array[i]);
        }
    }
    return pos;
}
