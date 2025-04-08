#pragma once

#include <vector>
#include <fstream>

#include "GUIManager.h"
#include "InputManager.h"

//Dati di LOG per benchmark
struct log_data_t{
    double data;
    float fps;
};

class Log_System{
public:
    /*
    * Scrive i dati registrati su un file csv
    */
    static void print_log();
    /*
    * Aggiunge il valore double fra quelli da registrare
    */
    static void add_data(double data);

private:
    static std::vector<log_data_t> log_data;
    static double last_data; //per evitare dati ridondanti
};