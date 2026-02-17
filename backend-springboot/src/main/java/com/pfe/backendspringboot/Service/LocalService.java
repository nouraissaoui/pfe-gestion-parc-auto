package com.pfe.backendspringboot.Service;


import java.util.Arrays;
import java.util.List;

import com.pfe.backendspringboot.Entities.Local;
import com.pfe.backendspringboot.Repository.LocalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


@Service
public class LocalService {

    @Autowired
    private LocalRepository repo;

    public Local save(Local l) {
        return repo.save(l);
    }

    public List<Local> getAll() {
        return repo.findAll();
    }

    public Local getById(Long id) {
        return repo.findById(id).orElse(null);
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Local introuvable");
        }
        repo.deleteById(id);
    }

    public Local update(Long id, Local newLocal){

        Local existing=repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Local not found"));

        existing.setNomLocal(newLocal.getNomLocal());
        existing.setAdresse(newLocal.getAdresse());
        existing.setRegion(newLocal.getRegion());
        existing.setVille(newLocal.getVille());
        existing.setImages(newLocal.getImages());

        return repo.save(existing);
    }
}