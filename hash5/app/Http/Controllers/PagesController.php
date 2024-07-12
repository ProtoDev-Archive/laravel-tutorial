<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PagesController extends Controller
{
    public function index(){
        $title = 'This is index'
        return view('pages.index', compact('title'));
    }

    public function about(){
        $title = 'This is about'
        return view('pages.index')->with('title', $title);
    }

    public function services(){
        $data = array(
            'title' => 'This is services'
            'services' => ['Web Design', 'Programming', 'SEO']
        );
        return view('pages.services')->with($data);
    }
}
