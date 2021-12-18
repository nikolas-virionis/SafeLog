package com.mycompany.client.java.entity;

import java.util.List;
import com.mycompany.client.java.util.ConfigDB;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;

public class Machine {

    // atributos
    private Integer pkMaquina;
    private String idMaquina;
    private String nome;
    private String senha;
    private String fkEmpresa;

    // construtores
    public Machine(Integer pkMaquina, String idMaquina, String nome, String senha, String fkEmpresa) {
        this.pkMaquina = pkMaquina;
        this.idMaquina = idMaquina;
        this.nome = nome;
        this.senha = senha;
        this.fkEmpresa = fkEmpresa;
    }

    public Machine() {
    }

    // getters / setters
    public Integer getPkMaquina() {
        return pkMaquina;
    }

    public void setPkMaquina(Integer pkMaquina) {
        this.pkMaquina = pkMaquina;
    }

    public String getIdMaquina() {
        return idMaquina;
    }

    public void setIdMaquina(String idMaquina) {
        this.idMaquina = idMaquina;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }

    public String getFkEmpresa() {
        return fkEmpresa;
    }

    public void setFkEmpresa(String fkEmpresa) {
        this.fkEmpresa = fkEmpresa;
    }

    public static List<Machine> selectAll() {
        // jdbcTemplate;
        try {
            JdbcTemplate jdbcTemplate = ConfigDB.getJdbcAWS();
            return jdbcTemplate.query("SELECT * FROM maquina", new BeanPropertyRowMapper<>(Machine.class));
        } catch (Exception e) {
            System.out.println("azure");
            JdbcTemplate jdbcTemplate = ConfigDB.getJdbcAzure();
            return jdbcTemplate.query("SELECT * FROM maquina", new BeanPropertyRowMapper<>(Machine.class));
        }

    }

    @Override
    public String toString() {
        return "Maquina [fkEmpresa=" + fkEmpresa + ", idMaquina=" + idMaquina + ", nome=" + nome + ", pkMaquina="
                + pkMaquina + "]";
    }
}
